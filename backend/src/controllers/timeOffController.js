const { query, withTransaction } = require('../config/db');

// List Time Off Types
async function getTimeOffTypes(req, res) {
  const types = await query('SELECT * FROM time_off_types WHERE is_active = TRUE ORDER BY id ASC');
  return res.json({ success: true, count: types.length, data: types });
}

// List Leave Allocations
async function getAllocations(req, res) {
  const { employee_id, year } = req.query;

  let sql = `
    SELECT a.*,
           e.emp_code, e.first_name, e.last_name,
           t.name as type_name, t.code as type_code, t.color as type_color, t.unit
    FROM time_off_allocations a
    JOIN employees e ON a.employee_id = e.id
    JOIN time_off_types t ON a.time_off_type_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'Employee') {
    sql += ` AND a.employee_id = ?`;
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ` AND a.employee_id = ?`;
    params.push(employee_id);
  }

  if (year) {
    sql += ` AND a.year = ?`;
    params.push(year);
  }

  sql += ` ORDER BY e.emp_code ASC, t.id ASC`;

  const allocations = await query(sql, params);
  return res.json({ success: true, count: allocations.length, data: allocations });
}

// Grant or update allocation (HR Admin)
async function setAllocation(req, res) {
  const { employee_id, time_off_type_id, year, allocated_days } = req.body;

  if (!employee_id || !time_off_type_id || !allocated_days) {
    return res.status(400).json({ success: false, message: 'Employee, leave type, and allocated days are required.' });
  }

  const yr = year || 2026;
  const days = Number(allocated_days);

  await query(
    `INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, used_days, remaining_days)
     VALUES (?, ?, ?, ?, 0.00, ?)
     ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days), remaining_days = VALUES(allocated_days) - used_days`,
    [employee_id, time_off_type_id, yr, days, days]
  );

  return res.json({ success: true, message: 'Leave allocation updated successfully.' });
}

// List Time Off Requests
async function getRequests(req, res) {
  const { employee_id, status, type_id } = req.query;

  let sql = `
    SELECT r.*,
           e.emp_code, e.first_name, e.last_name,
           d.name as department_name,
           t.name as type_name, t.code as type_code, t.color as type_color,
           app.first_name as approver_first_name, app.last_name as approver_last_name
    FROM time_off_requests r
    JOIN employees e ON r.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    JOIN time_off_types t ON r.time_off_type_id = t.id
    LEFT JOIN employees app ON r.approver_id = app.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'Employee') {
    sql += ` AND r.employee_id = ?`;
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ` AND r.employee_id = ?`;
    params.push(employee_id);
  }

  if (status) {
    sql += ` AND r.status = ?`;
    params.push(status);
  }

  if (type_id) {
    sql += ` AND r.time_off_type_id = ?`;
    params.push(type_id);
  }

  sql += ` ORDER BY r.created_at DESC`;

  const requests = await query(sql, params);
  return res.json({ success: true, count: requests.length, data: requests });
}

// Create Time Off Request
async function createRequest(req, res) {
  const employeeId = req.user.role === 'Employee' ? req.user.employee_id : (req.body.employee_id || req.user.employee_id);
  const { time_off_type_id, start_date, end_date, requested_amount, reason } = req.body;

  if (!time_off_type_id || !start_date || !end_date || !requested_amount || !reason) {
    return res.status(400).json({ success: false, message: 'All fields are required to submit a leave request.' });
  }

  const amount = Number(requested_amount);
  if (amount <= 0) {
    return res.status(400).json({ success: false, message: 'Requested amount must be greater than zero.' });
  }

  // Check time off type configuration
  const [types] = await query('SELECT * FROM time_off_types WHERE id = ?', [time_off_type_id]);
  if (types.length === 0) {
    return res.status(404).json({ success: false, message: 'Time off type not found.' });
  }
  const leaveType = types[0];

  // If allocation is required, check remaining balance
  if (leaveType.requires_allocation) {
    const year = new Date(start_date).getFullYear();
    const allocations = await query(
      `SELECT remaining_days FROM time_off_allocations WHERE employee_id = ? AND time_off_type_id = ? AND year = ?`,
      [employeeId, time_off_type_id, year]
    );

    const available = allocations.length > 0 ? Number(allocations[0].remaining_days) : 0;
    if (available < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You have ${available} days remaining for ${leaveType.name}, but requested ${amount} days.`
      });
    }
  }

  const [resInsert] = await query(
    `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, requested_amount, unit, reason, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [employeeId, time_off_type_id, start_date, end_date, amount, leaveType.unit, reason]
  );

  return res.status(201).json({
    success: true,
    message: 'Time off request submitted successfully. Awaiting HR approval.',
    request_id: resInsert.insertId
  });
}

// Approve Time Off Request (HR Manager / Admin)
async function approveRequest(req, res) {
  const { id } = req.params;
  const { notes } = req.body;
  const approverId = req.user.employee_id || req.user.id;

  const [requests] = await query(
    `SELECT r.*, t.requires_allocation, t.name as type_name
     FROM time_off_requests r
     JOIN time_off_types t ON r.time_off_type_id = t.id
     WHERE r.id = ?`,
    [id]
  );

  if (requests.length === 0) {
    return res.status(404).json({ success: false, message: 'Leave request not found.' });
  }

  const reqObj = requests[0];
  if (reqObj.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Request is already ${reqObj.status}.` });
  }

  await withTransaction(async (conn) => {
    // 1. Update request status
    await conn.query(
      `UPDATE time_off_requests SET
         status = 'approved', approver_id = ?, approval_notes = ?, approved_at = NOW()
       WHERE id = ?`,
      [approverId, notes || 'Approved by HR', id]
    );

    // 2. If requires allocation, deduct balance
    if (reqObj.requires_allocation) {
      const year = new Date(reqObj.start_date).getFullYear();
      await conn.query(
        `UPDATE time_off_allocations SET
           used_days = used_days + ?,
           remaining_days = remaining_days - ?
         WHERE employee_id = ? AND time_off_type_id = ? AND year = ?`,
        [reqObj.requested_amount, reqObj.requested_amount, reqObj.employee_id, reqObj.time_off_type_id, year]
      );
    }
  });

  return res.json({
    success: true,
    message: `Leave request for ${reqObj.requested_amount} days approved and allocation updated.`
  });
}

// Reject Time Off Request (HR Manager / Admin)
async function rejectRequest(req, res) {
  const { id } = req.params;
  const { notes } = req.body;
  const approverId = req.user.employee_id || req.user.id;

  const [requests] = await query('SELECT * FROM time_off_requests WHERE id = ?', [id]);
  if (requests.length === 0) {
    return res.status(404).json({ success: false, message: 'Leave request not found.' });
  }

  await query(
    `UPDATE time_off_requests SET
       status = 'rejected', approver_id = ?, approval_notes = ?, approved_at = NOW()
     WHERE id = ?`,
    [approverId, notes || 'Rejected by HR', id]
  );

  return res.json({ success: true, message: 'Leave request rejected.' });
}

module.exports = {
  getTimeOffTypes,
  getAllocations,
  setAllocation,
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest
};
