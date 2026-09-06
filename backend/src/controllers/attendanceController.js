const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { verifyCheckInLocation } = require('../services/locationService');

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalTimeString(d = new Date()) {
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

function parseTime(val) {
  if (!val) return null;
  const str = String(val).trim();
  const timePart = str.includes('T') ? str.split('T')[1].slice(0, 8) : (str.includes(' ') ? str.split(' ')[1].slice(0, 8) : str);
  const m = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const s = m[3] ? parseInt(m[3], 10) : 0;
  return {
    h,
    m: min,
    s,
    str: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  };
}

function getCleanTime(val) {
  const t = parseTime(val);
  return t ? t.str : getLocalTimeString();
}

function computeAttendanceDuration(checkIn, checkOut, inDateStr, outDateStr, breakHours = 1.0) {
  const tIn = parseTime(checkIn);
  const tOut = parseTime(checkOut);
  if (!tIn || !tOut) {
    return { valid: false, message: 'Invalid check-in or check-out time format.' };
  }

  let inMs, outMs;
  if (inDateStr && outDateStr) {
    const cleanInDate = typeof inDateStr === 'string' ? inDateStr.split('T')[0] : getLocalDateString(inDateStr);
    const cleanOutDate = typeof outDateStr === 'string' ? outDateStr.split('T')[0] : getLocalDateString(outDateStr);
    inMs = new Date(`${cleanInDate}T${tIn.str}`).getTime();
    outMs = new Date(`${cleanOutDate}T${tOut.str}`).getTime();
  } else {
    inMs = (tIn.h * 3600 + tIn.m * 60 + tIn.s) * 1000;
    outMs = (tOut.h * 3600 + tOut.m * 60 + tOut.s) * 1000;
    if (outMs < inMs) {
      outMs += 24 * 3600 * 1000;
    }
  }

  const elapsedMs = outMs - inMs;
  if (elapsedMs <= 0) {
    return { valid: false, message: 'Check-out time must be later than check-in time.' };
  }

  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const bHours = Number(breakHours) || 0;
  const worked = elapsedHours > bHours ? (elapsedHours - bHours) : elapsedHours;
  const workedHours = Math.round(worked * 100) / 100;

  return {
    valid: true,
    elapsedHours: Math.round(elapsedHours * 100) / 100,
    workedHours
  };
}

function computeWorkedHours(checkIn, checkOut, breakHours = 1.0, inDate = null, outDate = null) {
  const duration = computeAttendanceDuration(checkIn, checkOut, inDate, outDate, breakHours);
  return duration.valid ? duration.workedHours : 0;
}

async function getAttendance(req, res, next) {
  try {
    const { employee_id, start_date, end_date, date, status, search } = req.query;
    let sql = `
      SELECT a.*, 
             e.first_name, e.last_name, e.employee_code, e.avatar_url,
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
    } else if (employee_id && employee_id !== 'All' && employee_id !== 'all' && String(employee_id).trim() !== '') {
      sql += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (date && String(date).trim() !== '') {
      sql += ' AND a.date = ?';
      params.push(String(date).trim());
    } else {
      if (start_date && String(start_date).trim() !== '') {
        sql += ' AND a.date >= ?';
        params.push(String(start_date).trim());
      }
      if (end_date && String(end_date).trim() !== '') {
        sql += ' AND a.date <= ?';
        params.push(String(end_date).trim());
      }
    }

    if (status && status !== 'All' && status !== 'all' && String(status).trim() !== '') {
      sql += ' AND LOWER(a.status) = LOWER(?)';
      params.push(String(status).trim());
    }

    if (search && String(search).trim() !== '') {
      const searchPattern = `%${String(search).trim()}%`;
      sql += ` AND (
        CONCAT(e.first_name, ' ', e.last_name) LIKE ?
        OR e.employee_code LIKE ?
        OR d.name LIKE ?
        OR a.notes LIKE ?
      )`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
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

    const today = req.body.date || getLocalDateString();
    const nowTime = req.body.check_in ? getCleanTime(req.body.check_in) : getLocalTimeString();

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
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('unique_emp_date'))) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this employee on this date.'
      });
    }
    next(error);
  }
}

async function checkOut(req, res, next) {
  try {
    const employeeId = req.user.role === 'Employee' ? req.user.employee_id : (req.body.employee_id || req.user.employee_id);

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const today = req.body.date || getLocalDateString();
    const nowTime = req.body.check_out ? getCleanTime(req.body.check_out) : getLocalTimeString();

    // 1. Look for today's record first
    let existing = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    // 2. If no checked-in record for today, look for the most recent unclosed check-in session
    if (!existing || existing.length === 0 || !existing[0].check_in) {
      const openRecords = await query(
        'SELECT * FROM attendance WHERE employee_id = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY date DESC, id DESC LIMIT 1',
        [employeeId]
      );
      if (openRecords && openRecords.length > 0) {
        existing = openRecords;
      }
    }

    if (!existing || existing.length === 0 || !existing[0].check_in) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in.'
      });
    }

    const record = existing[0];
    if (record.check_out) {
      return res.status(400).json({
        success: false,
        message: `Already checked out at ${record.check_out}.`
      });
    }

    const inDateStr = typeof record.date === 'string' ? record.date.split('T')[0] : getLocalDateString(record.date);
    const outDateStr = today;

    const duration = computeAttendanceDuration(record.check_in, nowTime, inDateStr, outDateStr, record.break_hours);

    if (!duration.valid) {
      return res.status(400).json({
        success: false,
        message: duration.message || 'Check-out time must be later than check-in time.'
      });
    }

    const workedHours = duration.workedHours;
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
    const { date, check_in, check_out, break_hours, status, notes } = req.body;

    const [existing] = await query('SELECT * FROM attendance WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Attendance record ${id} not found.` });
    }

    let targetDate = existing.date;
    if (date) {
      const cleanDate = typeof date === 'string' ? date.split('T')[0] : getLocalDateString(new Date(date));
      const [conflict] = await query(
        'SELECT id FROM attendance WHERE employee_id = ? AND date = ? AND id != ?',
        [existing.employee_id, cleanDate, id]
      );
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Attendance already exists for this employee on this date.'
        });
      }
      targetDate = cleanDate;
    }

    const newIn = check_in || existing.check_in;
    const newOut = check_out !== undefined ? check_out : existing.check_out;
    const newBreak = break_hours !== undefined ? Number(break_hours) : Number(existing.break_hours);

    let workedHours = existing.worked_hours;
    if (newIn && newOut) {
      workedHours = computeWorkedHours(newIn, newOut, newBreak, targetDate, targetDate);
    }

    await query(
      `UPDATE attendance SET
        date = ?,
        check_in = ?,
        check_out = ?,
        break_hours = ?,
        worked_hours = ?,
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [targetDate, newIn, newOut, newBreak, workedHours, status, notes, id]
    );

    await logAudit(req.user.id, 'ATTENDANCE_MANUAL_CORRECTION', 'attendance', id, req.body);

    const [updated] = await query(
      `SELECT a.*, 
              e.first_name, e.last_name, e.employee_code, e.avatar_url,
              d.name AS department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.id = ?`,
      [id]
    );
    return res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: updated
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('unique_emp_date'))) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this employee on this date.'
      });
    }
    next(error);
  }
}

async function getTodayStatus(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.json({ success: true, data: null });
    }

    const today = getLocalDateString();
    let [record] = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    // If no record for today, check if there is an unclosed session from recent date
    if (!record) {
      const [pending] = await query(
        'SELECT * FROM attendance WHERE employee_id = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY date DESC, id DESC LIMIT 1',
        [employeeId]
      );
      if (pending) {
        record = pending;
      }
    }

    return res.json({
      success: true,
      data: record || null
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendanceById(req, res, next) {
  try {
    const { id } = req.params;
    const [record] = await query(
      `SELECT a.*, 
              e.first_name, e.last_name, e.employee_code, e.avatar_url,
              d.name AS department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.id = ?`,
      [id]
    );
    if (!record) {
      return res.status(404).json({ success: false, message: `Attendance record ${id} not found.` });
    }
    return res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function createAttendance(req, res, next) {
  try {
    const { employee_id, date, check_in, check_out, break_hours = 1.0, status = 'Present', notes } = req.body;
    if (!employee_id || !date) {
      return res.status(400).json({ success: false, message: 'Employee ID and date are required.' });
    }

    const cleanDate = typeof date === 'string' ? date.split('T')[0] : getLocalDateString(new Date(date));

    // Check whether an attendance record already exists for this employee and date
    const [existing] = await query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [employee_id, cleanDate]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this employee on this date.'
      });
    }

    let workedHours = 0;
    if (check_in && check_out) {
      const duration = computeAttendanceDuration(check_in, check_out, cleanDate, cleanDate, break_hours);
      if (!duration.valid) {
        return res.status(400).json({
          success: false,
          message: duration.message || 'Check-out time must be later than check-in time.'
        });
      }
      workedHours = duration.workedHours;
    }

    const cleanIn = check_in ? getCleanTime(check_in) : null;
    const cleanOut = check_out ? getCleanTime(check_out) : null;

    const result = await query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, break_hours, worked_hours, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, cleanDate, cleanIn, cleanOut, break_hours, workedHours, status, notes || null]
    );
    const [created] = await query(
      `SELECT a.*, 
              e.first_name, e.last_name, e.employee_code, e.avatar_url,
              d.name AS department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.id = ?`,
      [result.insertId]
    );
    await logAudit(req.user.id, 'ATTENDANCE_MANUAL_CREATE', 'attendance', result.insertId, req.body);
    return res.status(201).json({ success: true, message: 'Attendance record created successfully.', data: created });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('unique_emp_date'))) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this employee on this date.'
      });
    }
    next(error);
  }
}

module.exports = {
  getAttendance,
  getAttendanceById,
  createAttendance,
  checkIn,
  checkOut,
  updateAttendance,
  getTodayStatus
};
