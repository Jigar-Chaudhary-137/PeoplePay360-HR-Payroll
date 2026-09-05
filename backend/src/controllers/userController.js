const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

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
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  getDepartments
};
