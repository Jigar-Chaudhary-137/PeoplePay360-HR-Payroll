const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generate a secure 12-character temporary password
 * Guaranteed to contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.
 * Avoids ambiguous characters (O, 0, I, l) to ensure readability.
 */
function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + numbers + symbols;

  const chars = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)]
  ];

  for (let i = 0; i < 8; i++) {
    chars.push(all[crypto.randomInt(0, all.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

async function getEmployees(req, res, next) {
  try {
    const { search, department_id, status } = req.query;
    let sql = `
      SELECT e.*, 
             d.name AS department_name, 
             jp.title AS job_position_title,
             m.first_name AS manager_first_name, 
             m.last_name AS manager_last_name,
             ws.name AS working_schedule_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (
        e.first_name LIKE ? OR 
        e.last_name LIKE ? OR 
        e.employee_code LIKE ? OR 
        e.email LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (department_id) {
      sql += ` AND e.department_id = ?`;
      params.push(department_id);
    }

    if (status) {
      sql += ` AND e.employment_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY e.id ASC`;

    const employees = await query(sql, params);
    return res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    next(error);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

    const employees = await query(
      `SELECT e.*, 
              d.name AS department_name, 
              jp.title AS job_position_title,
              m.first_name AS manager_first_name, 
              m.last_name AS manager_last_name,
              ws.name AS working_schedule_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       LEFT JOIN employees m ON e.manager_id = m.id
       LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
       WHERE e.id = ?`,
      [id]
    );

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found.`
      });
    }

    const employee = employees[0];

    // Fetch related contracts
    const contracts = await query(
      `SELECT c.*, ss.name AS salary_structure_name 
       FROM contracts c
       JOIN salary_structures ss ON c.salary_structure_id = ss.id
       WHERE c.employee_id = ? 
       ORDER BY c.start_date DESC`,
      [id]
    );

    // Fetch related recent attendance (last 30 days)
    const attendance = await query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       ORDER BY date DESC LIMIT 30`,
      [id]
    );

    // Fetch related time off requests
    const timeOffRequests = await query(
      `SELECT tor.*, tot.name AS time_off_type_name
       FROM time_off_requests tor
       JOIN time_off_types tot ON tor.time_off_type_id = tot.id
       WHERE tor.employee_id = ?
       ORDER BY tor.start_date DESC`,
      [id]
    );

    // Fetch time off allocations
    const timeOffAllocations = await query(
      `SELECT toa.*, tot.name AS time_off_type_name
       FROM time_off_allocations toa
       JOIN time_off_types tot ON toa.time_off_type_id = tot.id
       WHERE toa.employee_id = ? AND toa.year = YEAR(CURDATE())`,
      [id]
    );

    // Fetch related payslips
    const payslips = await query(
      `SELECT ps.*, pr.name AS payrun_name
       FROM payslips ps
       JOIN payruns pr ON ps.payrun_id = pr.id
       WHERE ps.employee_id = ?
       ORDER BY ps.period_start DESC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...employee,
        contracts,
        attendance,
        time_off_requests: timeOffRequests,
        timeOffRequests,
        leaves: timeOffRequests,
        time_off_allocations: timeOffAllocations,
        leaveAllocations: timeOffAllocations,
        allocations: timeOffAllocations,
        payslips
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_position_id,
      manager_id,
      working_schedule_id,
      employment_status = 'Active',
      work_location,
      company,
      bank_name,
      bank_account_no,
      bank_ifsc,
      pan_no,
      pan_number,
      avatar_url,
      user_role
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and work email are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid work email address.'
      });
    }

    // Check if email already exists in employees table
    const existingEmp = await query('SELECT id FROM employees WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
    if (existingEmp && existingEmp.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email address already exists.'
      });
    }

    // Check if email already exists in users table
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user login account with this email address already exists.'
      });
    }

    const code = (employee_code && employee_code.trim()) ? employee_code.trim() : `EMP${Math.floor(1000 + Math.random() * 9000)}`;

    if (employee_code && employee_code.trim()) {
      const existingCode = await query('SELECT id FROM employees WHERE employee_code = ? LIMIT 1', [code]);
      if (existingCode && existingCode.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Employee code '${code}' is already in use.`
        });
      }
    }

    // Generate secure temporary password
    const temporaryPassword = generateTemporaryPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    // Resolve Employee role by role name rather than relying only on hardcoded role ID 5
    const targetRoleName = (user_role && user_role.trim()) ? user_role.trim() : 'Employee';
    let roleId = 5;
    let actualRoleName = 'Employee';
    const roleRows = await query('SELECT id, name FROM roles WHERE LOWER(name) = LOWER(?) LIMIT 1', [targetRoleName]);
    if (roleRows && roleRows.length > 0) {
      roleId = roleRows[0].id;
      actualRoleName = roleRows[0].name;
    } else {
      const defaultRoleRows = await query("SELECT id, name FROM roles WHERE LOWER(name) = 'employee' LIMIT 1");
      if (defaultRoleRows && defaultRoleRows.length > 0) {
        roleId = defaultRoleRows[0].id;
        actualRoleName = defaultRoleRows[0].name;
      }
    }

    const panValue = pan_no || pan_number || null;

    // Atomically create employee and user account within a transaction
    const transactionResult = await withTransaction(async (conn) => {
      // Concurrency check within transaction to prevent race conditions
      const [dupEmp] = await conn.query('SELECT id FROM employees WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
      if (dupEmp && dupEmp.length > 0) {
        const err = new Error('An employee with this email address already exists.');
        err.statusCode = 409;
        throw err;
      }

      const [dupUser] = await conn.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
      if (dupUser && dupUser.length > 0) {
        const err = new Error('A user login account with this email address already exists.');
        err.statusCode = 409;
        throw err;
      }

      const [empResult] = await conn.query(
        `INSERT INTO employees (
          employee_code, first_name, last_name, email, phone,
          department_id, job_position_id, manager_id, working_schedule_id,
          employment_status, work_location, company,
          bank_name, bank_account_no, bank_ifsc, pan_no, avatar_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, first_name.trim(), last_name.trim(), cleanEmail, phone || null,
          department_id || null, job_position_id || null, manager_id || null, working_schedule_id || 1,
          employment_status || 'Active', work_location || 'Main Office', company || 'PeoplePay360 Inc',
          bank_name || null, bank_account_no || null, bank_ifsc || null, panValue, avatar_url || null
        ]
      );

      const newEmployeeId = empResult.insertId;

      const [userResult] = await conn.query(
        `INSERT INTO users (
          employee_id, email, password_hash, role_id, status
        ) VALUES (?, ?, ?, ?, 'Active')`,
        [newEmployeeId, cleanEmail, passwordHash, roleId]
      );

      const [createdRows] = await conn.query('SELECT * FROM employees WHERE id = ?', [newEmployeeId]);

      return {
        employee: createdRows[0],
        userId: userResult.insertId
      };
    });

    // Audit logging without logging any passwords
    await logAudit(req.user?.id, 'CREATE_EMPLOYEE', 'employee', transactionResult.employee.id, {
      code,
      email: cleanEmail,
      user_id: transactionResult.userId,
      role: actualRoleName
    });

    return res.status(201).json({
      success: true,
      message: 'Employee and user login account created successfully.',
      data: {
        ...transactionResult.employee,
        login_credentials: {
          email: cleanEmail,
          temporary_password: temporaryPassword,
          role: actualRoleName,
          must_change_password: true,
          instructions: 'Please provide these credentials to the employee. The employee should change this temporary password upon first login.'
        }
      }
    });
  } catch (error) {
    if (error.statusCode === 409 || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: error.message && error.statusCode === 409 ? error.message : 'An employee or user login account with this email or code already exists.'
      });
    }
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_position_id,
      manager_id,
      working_schedule_id,
      employment_status,
      work_location,
      company,
      bank_name,
      bank_account_no,
      bank_ifsc,
      pan_no,
      avatar_url
    } = req.body;

    const existing = await query('SELECT * FROM employees WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found.`
      });
    }

    await query(
      `UPDATE employees SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department_id = COALESCE(?, department_id),
        job_position_id = COALESCE(?, job_position_id),
        manager_id = COALESCE(?, manager_id),
        working_schedule_id = COALESCE(?, working_schedule_id),
        employment_status = COALESCE(?, employment_status),
        work_location = COALESCE(?, work_location),
        company = COALESCE(?, company),
        bank_name = COALESCE(?, bank_name),
        bank_account_no = COALESCE(?, bank_account_no),
        bank_ifsc = COALESCE(?, bank_ifsc),
        pan_no = COALESCE(?, pan_no),
        avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [
        first_name, last_name, email, phone,
        department_id, job_position_id, manager_id, working_schedule_id,
        employment_status, work_location, company,
        bank_name, bank_account_no, bank_ifsc, pan_no, avatar_url,
        id
      ]
    );

    await logAudit(req.user?.id, 'UPDATE_EMPLOYEE', 'employee', id, req.body);

    const [updated] = await query('SELECT * FROM employees WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Employee updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id, employee_code FROM employees WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found.`
      });
    }

    await query('DELETE FROM employees WHERE id = ?', [id]);
    await logAudit(req.user?.id, 'DELETE_EMPLOYEE', 'employee', id, { code: existing[0].employee_code });

    return res.json({
      success: true,
      message: 'Employee deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
