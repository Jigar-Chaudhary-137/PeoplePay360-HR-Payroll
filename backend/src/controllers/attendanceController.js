const { query } = require('../config/db');
<<<<<<< HEAD

// List attendance records with filters
async function getAttendance(req, res) {
  const { employee_id, date, start_date, end_date, status } = req.query;

  let sql = `
    SELECT a.*,
           e.emp_code, e.first_name, e.last_name,
           d.name as department_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  // Employee role can only see their own attendance
  if (req.user.role === 'Employee') {
    sql += ` AND a.employee_id = ?`;
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ` AND a.employee_id = ?`;
    params.push(employee_id);
  }

  if (date) {
    sql += ` AND a.date = ?`;
    params.push(date);
  }

  if (start_date && end_date) {
    sql += ` AND a.date >= ? AND a.date <= ?`;
    params.push(start_date, end_date);
  }

  if (status) {
    sql += ` AND a.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY a.date DESC, a.check_in DESC LIMIT 200`;

  const records = await query(sql, params);
  return res.json({ success: true, count: records.length, data: records });
}

// Get today's attendance status for current user
async function getMyTodayStatus(req, res) {
  const employeeId = req.user.employee_id;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'No employee record linked to this user.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const records = await query(
    `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`,
    [employeeId, today]
  );

  return res.json({
    success: true,
    data: records.length > 0 ? records[0] : null
  });
}

// Check-in punch
async function checkIn(req, res) {
  const employeeId = req.user.employee_id || req.body.employee_id;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'Employee ID is required.' });
  }

  const now = new Date();
  const dateStr = req.body.date || now.toISOString().split('T')[0];
  const checkInTime = req.body.check_in || now.toISOString().slice(0, 19).replace('T', ' ');

  // Check if attendance already exists for today
  const existing = await query(
    `SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND date = ?`,
    [employeeId, dateStr]
  );

  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Already punched in today at ${existing[0].check_in}.`
    });
  }

  const [resInsert] = await query(
    `INSERT INTO attendance (employee_id, date, check_in, worked_hours, break_hours, status)
     VALUES (?, ?, ?, 0.00, 1.00, 'present')`,
    [employeeId, dateStr, checkInTime]
  );

  return res.status(201).json({
    success: true,
    message: 'Check-in recorded successfully.',
    attendance_id: resInsert.insertId,
    check_in: checkInTime
  });
}

// Check-out punch with worked hours calculation
async function checkOut(req, res) {
  const employeeId = req.user.employee_id || req.body.employee_id;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'Employee ID is required.' });
  }

  const now = new Date();
  const dateStr = req.body.date || now.toISOString().split('T')[0];
  const checkOutTime = req.body.check_out || now.toISOString().slice(0, 19).replace('T', ' ');

  const records = await query(
    `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`,
    [employeeId, dateStr]
  );

  if (records.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No check-in record found for today. Please check-in first.'
    });
  }

  const record = records[0];
  const checkInDate = new Date(record.check_in);
  const checkOutDate = new Date(checkOutTime);

  if (checkOutDate <= checkInDate) {
    return res.status(400).json({
      success: false,
      message: 'Check-out time cannot be earlier than or equal to check-in time.'
    });
  }

  // Calculate worked hours
  const totalElapsedHours = (checkOutDate - checkInDate) / (1000 * 60 * 60);
  const breakHours = Number(record.break_hours) || 1.00;
  const workedHours = Math.max(0, Math.round((totalElapsedHours - breakHours) * 100) / 100);
  const overtimeHours = workedHours > 8.00 ? Math.round((workedHours - 8.00) * 100) / 100 : 0.00;
  const status = workedHours < 4.00 ? 'half_day' : 'present';

  await query(
    `UPDATE attendance SET
       check_out = ?, worked_hours = ?, overtime_hours = ?, status = ?
     WHERE id = ?`,
    [checkOutTime, workedHours, overtimeHours, status, record.id]
  );

  return res.json({
    success: true,
    message: `Check-out recorded. Worked: ${workedHours} hrs (Overtime: ${overtimeHours} hrs).`,
    worked_hours: workedHours,
    overtime_hours: overtimeHours
  });
}

// Authorized manual correction
async function manualCorrection(req, res) {
  const { id } = req.params;
  const { check_in, check_out, break_hours, status, notes } = req.body;

  const checkInDate = new Date(check_in);
  const checkOutDate = check_out ? new Date(check_out) : null;

  let workedHours = 0;
  let overtimeHours = 0;

  if (checkOutDate) {
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out time must be after check-in time.'
      });
    }
    const elapsed = (checkOutDate - checkInDate) / (1000 * 60 * 60);
    const bh = Number(break_hours) || 1.00;
    workedHours = Math.max(0, Math.round((elapsed - bh) * 100) / 100);
    overtimeHours = workedHours > 8.00 ? Math.round((workedHours - 8.00) * 100) / 100 : 0.00;
  }

  await query(
    `UPDATE attendance SET
       check_in = ?, check_out = ?, break_hours = ?, worked_hours = ?,
       overtime_hours = ?, status = ?, notes = ?, is_manual_correction = TRUE
     WHERE id = ?`,
    [
      check_in, check_out || null, break_hours || 1.00, workedHours,
      overtimeHours, status || 'present', notes || 'Manual HR correction', id
    ]
  );

  return res.json({
    success: true,
    message: 'Attendance record corrected successfully.',
    worked_hours: workedHours
  });
=======
const { logAudit } = require('../utils/auditLogger');

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

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0]; // 'HH:MM:SS'

    // Check if record exists for today
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (existing && existing.length > 0) {
      if (existing[0].check_in) {
        return res.status(400).json({
          success: false,
          message: `Already checked in at ${existing[0].check_in}.`
        });
      }
      await query(
        'UPDATE attendance SET check_in = ?, status = ? WHERE id = ?',
        [nowTime, 'Present', existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO attendance (employee_id, date, check_in, status, break_hours, worked_hours)
         VALUES (?, ?, ?, 'Present', 1.0, 0)`,
        [employeeId, today, nowTime]
      );
    }

    const [updated] = await query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    await logAudit(req.user.id, 'ATTENDANCE_CHECK_IN', 'attendance', updated.id, { check_in: nowTime });

    return res.json({
      success: true,
      message: `Checked in successfully at ${nowTime}`,
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
>>>>>>> feature/backend
}

module.exports = {
  getAttendance,
<<<<<<< HEAD
  getMyTodayStatus,
  checkIn,
  checkOut,
  manualCorrection
=======
  checkIn,
  checkOut,
  updateAttendance,
  getTodayStatus
>>>>>>> feature/backend
};
