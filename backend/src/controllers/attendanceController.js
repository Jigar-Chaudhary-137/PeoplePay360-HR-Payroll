const { query } = require('../config/db');

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
}

module.exports = {
  getAttendance,
  getMyTodayStatus,
  checkIn,
  checkOut,
  manualCorrection
};
