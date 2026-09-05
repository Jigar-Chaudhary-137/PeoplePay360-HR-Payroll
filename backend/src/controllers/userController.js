const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
<<<<<<< HEAD

// List users with linked employee information
async function getUsers(req, res) {
  const users = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.role, u.account_status, u.created_at,
            e.emp_code, e.first_name, e.last_name, d.name as department_name, jp.title as job_title
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     ORDER BY u.id ASC`
  );
  return res.json({ success: true, count: users.length, data: users });
}

// Create new user (Admin)
async function createUser(req, res) {
  const { work_email, password, role, employee_id, account_status } = req.body;

  if (!work_email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Work email, password, and role are required.' });
  }

  const existing = await query('SELECT id FROM users WHERE work_email = ?', [work_email.trim().toLowerCase()]);
  if (existing.length > 0) {
    return res.status(400).json({ success: false, message: 'A user with this work email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [resInsert] = await query(
    `INSERT INTO users (employee_id, work_email, password_hash, role, account_status)
     VALUES (?, ?, ?, ?, ?)`,
    [employee_id || null, work_email.trim().toLowerCase(), passwordHash, role, account_status || 'Active']
  );

  return res.status(201).json({
    success: true,
    message: `User account for ${work_email} created successfully.`,
    user_id: resInsert.insertId
  });
}

// Update user role / status
async function updateUser(req, res) {
  const { id } = req.params;
  const { role, account_status, employee_id, password } = req.body;

  let sql = 'UPDATE users SET role = ?, account_status = ?, employee_id = ?';
  const params = [role, account_status, employee_id || null];

  if (password && password.trim() !== '') {
    const hash = await bcrypt.hash(password, 10);
    sql += ', password_hash = ?';
    params.push(hash);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  await query(sql, params);
  return res.json({ success: true, message: 'User updated successfully.' });
}

// List departments and job positions
async function getDepartments(req, res) {
  const departments = await query(
    `SELECT d.*,
            (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) as employee_count
     FROM departments d
     ORDER BY d.name ASC`
  );

  for (const d of departments) {
    d.positions = await query('SELECT * FROM job_positions WHERE department_id = ? ORDER BY title ASC', [d.id]);
  }

  return res.json({ success: true, count: departments.length, data: departments });
=======
const { logAudit } = require('../utils/auditLogger');

async function getUsers(req, res, next) {
  try {
    const users = await query(
      `SELECT u.id, u.email, u.status, u.employee_id, u.created_at,
              r.id AS role_id, r.name AS role_name,
              e.first_name, e.last_name, e.employee_code, e.avatar_url,
              d.name AS department_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY u.id ASC`
    );

    return res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

async function getRoles(req, res, next) {
  try {
    const roles = await query('SELECT * FROM roles ORDER BY id ASC');
    return res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { employee_id, email, password, role_id, status = 'Active' } = req.body;
    if (!email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'email, password, and role_id are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (employee_id, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [employee_id || null, email.trim().toLowerCase(), hash, role_id, status]
    );

    await logAudit(req.user?.id, 'CREATE_USER', 'user', result.insertId, { email, role_id });

    const [created] = await query(
      `SELECT u.id, u.email, u.status, u.employee_id, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'User created successfully.', data: created });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A user with this email or linked employee already exists.' });
    }
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { employee_id, email, password, role_id, status } = req.body;

    let hash = null;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      hash = await bcrypt.hash(password, salt);
    }

    await query(
      `UPDATE users SET
        employee_id = COALESCE(?, employee_id),
        email = COALESCE(?, email),
        password_hash = COALESCE(?, password_hash),
        role_id = COALESCE(?, role_id),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        employee_id !== undefined ? employee_id : null,
        email ? email.trim().toLowerCase() : null,
        hash,
        role_id,
        status,
        id
      ]
    );

    await logAudit(req.user?.id, 'UPDATE_USER', 'user', id, { email, role_id, status });

    const [updated] = await query(
      `SELECT u.id, u.email, u.status, u.employee_id, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [id]
    );

    return res.json({ success: true, message: 'User updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
>>>>>>> feature/backend
}

module.exports = {
  getUsers,
<<<<<<< HEAD
  createUser,
  updateUser,
  getDepartments
=======
  getRoles,
  createUser,
  updateUser
>>>>>>> feature/backend
};
