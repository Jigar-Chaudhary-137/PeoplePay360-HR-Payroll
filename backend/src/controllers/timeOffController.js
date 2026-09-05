const { query, getTransactionConnection } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Time Off Types
async function getTimeOffTypes(req, res, next) {
  try {
    const types = await query('SELECT * FROM time_off_types WHERE is_active = TRUE ORDER BY id ASC');
    return res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
}

async function createTimeOffType(req, res, next) {
  try {
    const { name, unit = 'Days', requires_allocation = true, requires_approval = true } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Time off type name is required.' });
    }

    const result = await query(
      'INSERT INTO time_off_types (name, unit, requires_allocation, requires_approval) VALUES (?, ?, ?, ?)',
      [name, unit, requires_allocation, requires_approval]
    );

    const [created] = await query('SELECT * FROM time_off_types WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

// 2. Time Off Allocations
async function getTimeOffAllocations(req, res, next) {
  try {
    const { employee_id, year } = req.query;
    let sql = `
      SELECT toa.*,
             tot.name AS time_off_type_name, tot.unit,
             e.first_name, e.last_name, e.employee_code,
             (toa.allocated_days - toa.used_days) AS remaining_days
      FROM time_off_allocations toa
      JOIN time_off_types tot ON toa.time_off_type_id = tot.id
      JOIN employees e ON toa.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'Employee' && req.user.employee_id) {
      sql += ' AND toa.employee_id = ?';
      params.push(req.user.employee_id);
    } else if (employee_id) {
      sql += ' AND toa.employee_id = ?';
      params.push(employee_id);
    }

    if (year) {
      sql += ' AND toa.year = ?';
      params.push(year);
    }

    sql += ' ORDER BY e.first_name ASC, tot.name ASC';
    const allocations = await query(sql, params);

    return res.json({ success: true, data: allocations });
  } catch (error) {
    next(error);
  }
}

async function createOrUpdateAllocation(req, res, next) {
  try {
    const { employee_id, time_off_type_id, allocated_days, year = new Date().getFullYear() } = req.body;
    if (!employee_id || !time_off_type_id || allocated_days === undefined) {
      return res.status(400).json({ success: false, message: 'employee_id, time_off_type_id, and allocated_days are required.' });
    }

    await query(
      `INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_days, used_days, year)
       VALUES (?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days)`,
      [employee_id, time_off_type_id, allocated_days, year]
    );

    const [alloc] = await query(
      'SELECT * FROM time_off_allocations WHERE employee_id = ? AND time_off_type_id = ? AND year = ?',
      [employee_id, time_off_type_id, year]
    );

    return res.json({ success: true, message: 'Allocation saved successfully.', data: alloc });
  } catch (error) {
    next(error);
  }
}

// 3. Time Off Requests
async function getTimeOffRequests(req, res, next) {
  try {
    const { employee_id, status } = req.query;
    let sql = `
      SELECT tor.*,
             tot.name AS time_off_type_name,
             e.first_name, e.last_name, e.employee_code,
             u.email AS approver_email
      FROM time_off_requests tor
      JOIN time_off_types tot ON tor.time_off_type_id = tot.id
      JOIN employees e ON tor.employee_id = e.id
      LEFT JOIN users u ON tor.approver_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'Employee' && req.user.employee_id) {
      sql += ' AND tor.employee_id = ?';
      params.push(req.user.employee_id);
    } else if (employee_id) {
      sql += ' AND tor.employee_id = ?';
      params.push(employee_id);
    }

    if (status) {
      sql += ' AND tor.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY tor.start_date DESC';
    const requests = await query(sql, params);

    return res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
}

async function createTimeOffRequest(req, res, next) {
  try {
    const employeeId = req.user.role === 'Employee' ? req.user.employee_id : (req.body.employee_id || req.user.employee_id);
    const { time_off_type_id, start_date, end_date, days_requested, reason } = req.body;

    if (!employeeId || !time_off_type_id || !start_date || !end_date || !days_requested) {
      return res.status(400).json({
        success: false,
        message: 'employee_id, time_off_type_id, start_date, end_date, and days_requested are required.'
      });
    }

    // Check time off type configuration
    const [type] = await query('SELECT * FROM time_off_types WHERE id = ?', [time_off_type_id]);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Invalid time off type.' });
    }

    // If type requires allocation, check available balance
    if (type.requires_allocation) {
      const year = new Date(start_date).getFullYear();
      const allocations = await query(
        'SELECT allocated_days, used_days FROM time_off_allocations WHERE employee_id = ? AND time_off_type_id = ? AND year = ?',
        [employeeId, time_off_type_id, year]
      );

      if (!allocations || allocations.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No allocation found for ${type.name} in year ${year}. Request cannot be submitted.`
        });
      }

      const available = Number(allocations[0].allocated_days) - Number(allocations[0].used_days);
      if (Number(days_requested) > available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. Requested: ${days_requested} days, Available: ${available} days.`
        });
      }
    }

    // Insert request with 'Pending' status (balance is NOT reduced before approval!)
    const result = await query(
      `INSERT INTO time_off_requests (
        employee_id, time_off_type_id, start_date, end_date, days_requested, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [employeeId, time_off_type_id, start_date, end_date, days_requested, reason || null]
    );

    const [created] = await query('SELECT * FROM time_off_requests WHERE id = ?', [result.insertId]);
    await logAudit(req.user.id, 'CREATE_LEAVE_REQUEST', 'time_off_request', result.insertId, { days: days_requested });

    return res.status(201).json({
      success: true,
      message: 'Time off request submitted successfully and is pending approval.',
      data: created
    });
  } catch (error) {
    next(error);
  }
}

async function approveTimeOffRequest(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { id } = req.params;

    const [requests] = await conn.query(
      `SELECT tor.*, tot.requires_allocation, tot.name AS type_name 
       FROM time_off_requests tor
       JOIN time_off_types tot ON tor.time_off_type_id = tot.id
       WHERE tor.id = ? FOR UPDATE`,
      [id]
    );

    if (!requests || requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Time off request not found.' });
    }

    const reqItem = requests[0];
    if (reqItem.status !== 'Pending') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Request is already ${reqItem.status}.` });
    }

    // If allocation is required, check and deduct balance within transaction
    if (reqItem.requires_allocation) {
      const year = new Date(reqItem.start_date).getFullYear();
      const [allocRows] = await conn.query(
        `SELECT id, allocated_days, used_days 
         FROM time_off_allocations 
         WHERE employee_id = ? AND time_off_type_id = ? AND year = ? FOR UPDATE`,
        [reqItem.employee_id, reqItem.time_off_type_id, year]
      );

      if (!allocRows || allocRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'No allocation record found to deduct from.' });
      }

      const alloc = allocRows[0];
      const newUsed = Number(alloc.used_days) + Number(reqItem.days_requested);
      if (newUsed > Number(alloc.allocated_days)) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Exceeds allocated balance. Allocated: ${alloc.allocated_days}, Already used: ${alloc.used_days}, Requested: ${reqItem.days_requested}`
        });
      }

      await conn.query(
        'UPDATE time_off_allocations SET used_days = ? WHERE id = ?',
        [newUsed, alloc.id]
      );
    }

    // Update request status to Approved
    await conn.query(
      `UPDATE time_off_requests 
       SET status = 'Approved', approver_id = ?, approved_at = NOW() 
       WHERE id = ?`,
      [req.user.id, id]
    );

    await conn.commit();
    await logAudit(req.user.id, 'APPROVE_LEAVE_REQUEST', 'time_off_request', id, { days: reqItem.days_requested });

    const [updated] = await query('SELECT * FROM time_off_requests WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Time off request approved and leave allocation updated.',
      data: updated
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

async function rejectTimeOffRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const [existing] = await query('SELECT * FROM time_off_requests WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (existing.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${existing.status}.` });
    }

    await query(
      `UPDATE time_off_requests 
       SET status = 'Rejected', approver_id = ?, rejection_reason = ?, approved_at = NOW() 
       WHERE id = ?`,
      [req.user.id, rejection_reason || 'Rejected by management.', id]
    );

    await logAudit(req.user.id, 'REJECT_LEAVE_REQUEST', 'time_off_request', id, { reason: rejection_reason });

    const [updated] = await query('SELECT * FROM time_off_requests WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Time off request rejected.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTimeOffTypes,
  createTimeOffType,
  getTimeOffAllocations,
  createOrUpdateAllocation,
  getTimeOffRequests,
  createTimeOffRequest,
  approveTimeOffRequest,
  rejectTimeOffRequest
};
