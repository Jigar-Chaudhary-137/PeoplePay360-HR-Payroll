const { query, withTransaction } = require('../config/db');

// List all employees with search & filters
async function getEmployees(req, res) {
  const { search, department_id, status } = req.query;

  let sql = `
    SELECT e.*,
           d.name as department_name, d.code as department_code,
           jp.title as job_title, jp.grade as job_grade,
           ws.name as schedule_name,
           u.role as user_role, u.account_status,
           c.id as active_contract_id, c.contract_code as active_contract_code,
           c.wage as active_wage, c.status as contract_status
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN job_positions jp ON e.job_position_id = jp.id
    LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
    LEFT JOIN users u ON u.employee_id = e.id
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'running'
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.emp_code LIKE ? OR e.email LIKE ?)`;
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
  return res.json({ success: true, count: employees.length, data: employees });
}

// Get single employee details with all related records
async function getEmployeeById(req, res) {
  const { id } = req.params;

  // Enforce Employee role self-service boundary
  if (req.user.role === 'Employee' && req.user.employee_id !== parseInt(id, 10)) {
    return res.status(403).json({ success: false, message: 'You can only view your own employee profile.' });
  }

  const employees = await query(
    `SELECT e.*,
            d.name as department_name,
            jp.title as job_title,
            ws.name as schedule_name,
            u.id as user_id, u.role as user_role, u.account_status
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
     LEFT JOIN users u ON u.employee_id = e.id
     WHERE e.id = ?`,
    [id]
  );

  if (employees.length === 0) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const employee = employees[0];

  // Related Contracts
  const contracts = await query(
    `SELECT c.*, s.name as structure_name, ws.name as schedule_name
     FROM contracts c
     JOIN salary_structures s ON c.salary_structure_id = s.id
     LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
     WHERE c.employee_id = ?
     ORDER BY c.start_date DESC`,
    [id]
  );

  // Related Attendance (Recent 30 records)
  const attendance = await query(
    `SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30`,
    [id]
  );

  // Related Time Off Requests
  const timeOffRequests = await query(
    `SELECT r.*, t.name as type_name, t.color as type_color
     FROM time_off_requests r
     JOIN time_off_types t ON r.time_off_type_id = t.id
     WHERE r.employee_id = ?
     ORDER BY r.start_date DESC`,
    [id]
  );

  // Related Leave Allocations
  const leaveAllocations = await query(
    `SELECT a.*, t.name as type_name, t.code as type_code, t.color as type_color
     FROM time_off_allocations a
     JOIN time_off_types t ON a.time_off_type_id = t.id
     WHERE a.employee_id = ? AND a.year = 2026`,
    [id]
  );

  // Related Payslips
  const payslips = await query(
    `SELECT p.*, pr.name as payrun_name
     FROM payslips p
     JOIN payruns pr ON p.payrun_id = pr.id
     WHERE p.employee_id = ?
     ORDER BY p.period_month DESC`,
    [id]
  );

  return res.json({
    success: true,
    data: {
      ...employee,
      contracts,
      attendance,
      timeOffRequests,
      leaveAllocations,
      payslips
    }
  });
}

// Create new employee
async function createEmployee(req, res) {
  const {
    first_name, last_name, email, phone, gender, date_of_birth, joining_date,
    department_id, job_position_id, employment_status, working_schedule_id,
    bank_name, bank_account_no, bank_ifsc, pan_number, create_user_account, user_role
  } = req.body;

  if (!first_name || !last_name || !email || !joining_date) {
    return res.status(400).json({ success: false, message: 'First name, last name, email, and joining date are required.' });
  }

  // Generate unique employee code: EMP + sequence
  const [countRes] = await query('SELECT COUNT(*) as count FROM employees');
  const empCode = `EMP${String((countRes[0]?.count || 0) + 1).padStart(3, '0')}`;

  const result = await withTransaction(async (conn) => {
    const [empRes] = await conn.query(
      `INSERT INTO employees (
        emp_code, first_name, last_name, email, phone, gender, date_of_birth,
        joining_date, department_id, job_position_id, employment_status,
        working_schedule_id, bank_name, bank_account_no, bank_ifsc, pan_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empCode, first_name, last_name, email, phone || null, gender || 'Male',
        date_of_birth || null, joining_date, department_id || null, job_position_id || null,
        employment_status || 'active', working_schedule_id || null,
        bank_name || null, bank_account_no || null, bank_ifsc || null, pan_number || null
      ]
    );

    const newEmpId = empRes.insertId;

    // Optional user account creation
    if (create_user_account) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password@123', 10);
      await conn.query(
        `INSERT INTO users (employee_id, work_email, password_hash, role, account_status)
         VALUES (?, ?, ?, ?, 'Active')`,
        [newEmpId, email, hash, user_role || 'Employee']
      );
    }

    // Default Leave Allocations
    const [types] = await conn.query('SELECT id, code FROM time_off_types WHERE requires_allocation = TRUE');
    for (const t of types) {
      const defaultDays = t.code === 'PTO' ? 18.00 : (t.code === 'SL' ? 10.00 : 3.00);
      await conn.query(
        `INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, used_days, remaining_days)
         VALUES (?, ?, 2026, ?, 0.00, ?)`,
        [newEmpId, t.id, defaultDays, defaultDays]
      );
    }

    return newEmpId;
  });

  return res.status(201).json({
    success: true,
    message: `Employee ${first_name} ${last_name} (${empCode}) created successfully.`,
    employee_id: result,
    emp_code: empCode
  });
}

// Update employee
async function updateEmployee(req, res) {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, gender, date_of_birth, joining_date,
    department_id, job_position_id, employment_status, working_schedule_id,
    bank_name, bank_account_no, bank_ifsc, pan_number
  } = req.body;

  await query(
    `UPDATE employees SET
       first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?,
       date_of_birth = ?, joining_date = ?, department_id = ?, job_position_id = ?,
       employment_status = ?, working_schedule_id = ?, bank_name = ?,
       bank_account_no = ?, bank_ifsc = ?, pan_number = ?
     WHERE id = ?`,
    [
      first_name, last_name, email, phone, gender, date_of_birth, joining_date,
      department_id, job_position_id, employment_status, working_schedule_id,
      bank_name, bank_account_no, bank_ifsc, pan_number, id
    ]
  );

  return res.json({ success: true, message: 'Employee updated successfully.' });
}

// Delete employee
async function deleteEmployee(req, res) {
  const { id } = req.params;
  await query('DELETE FROM employees WHERE id = ?', [id]);
  return res.json({ success: true, message: 'Employee deleted successfully.' });
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
