const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

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

    return res.json({
      success: true,
      data: {
        ...employee,
        contracts,
        attendance,
        time_off_requests: timeOffRequests,
        time_off_allocations: timeOffAllocations
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
      avatar_url
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and work email are required.'
      });
    }

    const code = employee_code || `EMP${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await query(
      `INSERT INTO employees (
        employee_code, first_name, last_name, email, phone,
        department_id, job_position_id, manager_id, working_schedule_id,
        employment_status, work_location, company,
        bank_name, bank_account_no, bank_ifsc, pan_no, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, first_name, last_name, email, phone || null,
        department_id || null, job_position_id || null, manager_id || null, working_schedule_id || 1,
        employment_status, work_location || 'Main Office', company || 'PeoplePay360 Inc',
        bank_name || null, bank_account_no || null, bank_ifsc || null, pan_no || null, avatar_url || null
      ]
    );

    const newId = result.insertId;
    await logAudit(req.user?.id, 'CREATE_EMPLOYEE', 'employee', newId, { code, email });

    const [created] = await query('SELECT * FROM employees WHERE id = ?', [newId]);

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: created
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email or employee code already exists.'
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
