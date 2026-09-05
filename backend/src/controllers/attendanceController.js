const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { verifyCheckInLocation } = require('../services/locationService');

function computeWorkedHours(checkIn, checkOut, breakHours = 1.0) {
  if (!checkIn || !checkOut) return 0;
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const inMins = inH * 60 + inM;
  const outMins = outH * 60 + outM;

  if (outMins <= inMins) {
    return 0;
  }

  const workedMins = Math.max(0, (outMins - inMins) - (Number(breakHours) * 60));
  return Math.round((workedMins / 60) * 100) / 100;
}

async function getAttendance(req, res, next) {
  try {
    const { employee_id, start_date, end_date, status } = req.query;
    let sql = `
      SELECT a.*, 
             e.first_name, e.last_name, e.employee_code,
             d.name AS department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // If regular Employee role, restrict to their own attendance
    if (req.user.role === 'Employee' && req.user.employee_id) {
      sql += ' AND a.employee_id = ?';
      params.push(req.user.employee_id);
    } else if (employee_id) {
      sql += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (start_date) {
      sql += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND a.date <= ?';
      params.push(end_date);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.date DESC, e.first_name ASC';

    const records = await query(sql, params);
    return res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
}

async function checkIn(req, res, next) {
  try {
    const employeeId = req.user.role === 'Employee' ? req.user.employee_id : (req.body.employee_id || req.user.employee_id);

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const { latitude, longitude, accuracy } = req.body;

    // Verify location if coordinates provided or work location configured
    const verification = await verifyCheckInLocation(employeeId, latitude, longitude);

    if (!verification.allowed) {
      return res.status(403).json({
        success: false,
        message: verification.message,
        distance_meters: verification.distance,
        radius_meters: verification.radius_meters
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0]; // 'HH:MM:SS'

    // Check if record exists for today
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    const latVal = latitude !== undefined && latitude !== null ? Number(latitude) : null;
    const lonVal = longitude !== undefined && longitude !== null ? Number(longitude) : null;
    const accVal = accuracy !== undefined && accuracy !== null ? Number(accuracy) : null;
    const distVal = verification.distance !== undefined ? verification.distance : null;
    const locVerified = verification.location_verified ? 1 : 0;
    const locId = verification.work_location_id || null;

    if (existing && existing.length > 0) {
      if (existing[0].check_in) {
        return res.status(400).json({
          success: false,
          message: `Already checked in at ${existing[0].check_in}.`
        });
      }
      await query(
        `UPDATE attendance SET 
           check_in = ?, 
           status = ?, 
           latitude = ?, 
           longitude = ?, 
           accuracy = ?, 
           distance_meters = ?, 
           location_verified = ?, 
           work_location_id = ? 
         WHERE id = ?`,
        [nowTime, 'Present', latVal, lonVal, accVal, distVal, locVerified, locId, existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO attendance (
           employee_id, date, check_in, status, break_hours, worked_hours,
           latitude, longitude, accuracy, distance_meters, location_verified, work_location_id
         ) VALUES (?, ?, ?, 'Present', 1.0, 0, ?, ?, ?, ?, ?, ?)`,
        [employeeId, today, nowTime, latVal, lonVal, accVal, distVal, locVerified, locId]
      );
    }

    const [updated] = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    await logAudit(req.user.id, 'ATTENDANCE_CHECK_IN', 'attendance', updated.id, {
      check_in: nowTime,
      location_verified: verification.location_verified,
      distance_meters: distVal
    });

    return res.json({
      success: true,
      message: verification.location_verified 
        ? `Checked in successfully with location verification (${distVal}m from office)`
        : `Checked in successfully at ${nowTime}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function checkOut(req, res, next) {
  try {
    const employeeId = req.user.role === 'Employee' ? req.user.employee_id : (req.body.employee_id || req.user.employee_id);

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0]; // 'HH:MM:SS'

    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (!existing || existing.length === 0 || !existing[0].check_in) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in.'
      });
    }

    const record = existing[0];
    const workedHours = computeWorkedHours(record.check_in, nowTime, record.break_hours);

    if (workedHours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Check-out time must be later than check-in time.'
      });
    }

    const status = workedHours < 4 ? 'Half Day' : 'Present';

    await query(
      `UPDATE attendance SET check_out = ?, worked_hours = ?, status = ? WHERE id = ?`,
      [nowTime, workedHours, status, record.id]
    );

    const [updated] = await query('SELECT * FROM attendance WHERE id = ?', [record.id]);
    await logAudit(req.user.id, 'ATTENDANCE_CHECK_OUT', 'attendance', record.id, { check_out: nowTime, workedHours });

    return res.json({
      success: true,
      message: `Checked out successfully. Worked hours: ${workedHours}h.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { check_in, check_out, break_hours, status, notes } = req.body;

    const [existing] = await query('SELECT * FROM attendance WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Attendance record ${id} not found.` });
    }

    const newIn = check_in || existing.check_in;
    const newOut = check_out !== undefined ? check_out : existing.check_out;
    const newBreak = break_hours !== undefined ? Number(break_hours) : Number(existing.break_hours);

    let workedHours = existing.worked_hours;
    if (newIn && newOut) {
      workedHours = computeWorkedHours(newIn, newOut, newBreak);
    }

    await query(
      `UPDATE attendance SET
        check_in = ?,
        check_out = ?,
        break_hours = ?,
        worked_hours = ?,
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [newIn, newOut, newBreak, workedHours, status, notes, id]
    );

    await logAudit(req.user.id, 'ATTENDANCE_MANUAL_CORRECTION', 'attendance', id, req.body);

    const [updated] = await query('SELECT * FROM attendance WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function getTodayStatus(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.json({ success: true, data: null });
    }

    const today = new Date().toISOString().split('T')[0];
    const [record] = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    return res.json({
      success: true,
      data: record || null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendance,
  checkIn,
  checkOut,
  updateAttendance,
  getTodayStatus
};
