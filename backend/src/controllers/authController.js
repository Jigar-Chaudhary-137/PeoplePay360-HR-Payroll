const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  const users = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.password_hash, u.role, u.account_status,
            e.emp_code, e.first_name, e.last_name, e.department_id, d.name as department_name,
            e.avatar_url
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE u.work_email = ?`,
    [email.trim().toLowerCase()]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User not found.'
    });
  }

  const user = users[0];

  if (user.account_status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated. Please contact your system administrator.'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Incorrect password.'
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      employee_id: user.employee_id,
      email: user.work_email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return safe user payload (no password hash)
  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      employee_id: user.employee_id,
      emp_code: user.emp_code,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.work_email,
      role: user.role,
      department_name: user.department_name,
      avatar_url: user.avatar_url
    }
  });
}

async function getMe(req, res) {
  const users = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.role, u.account_status,
            e.emp_code, e.first_name, e.last_name, e.phone, e.joining_date,
            d.name as department_name, jp.title as job_title,
            e.bank_name, e.bank_account_no, e.bank_ifsc, e.pan_number, e.avatar_url
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (users.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({
    success: true,
    user: users[0]
  });
}

// Switch demo role for instant hackathon walkthrough evaluation
async function switchDemoRole(req, res) {
  const { targetRole } = req.body;
  const allowedRoles = ['Admin', 'HR Payroll Admin', 'HR Payroll User', 'HR Manager', 'Employee'];

  if (!allowedRoles.includes(targetRole)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  // Find demo account for targetRole
  const demoUsers = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.role,
            e.emp_code, e.first_name, e.last_name, d.name as department_name
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE u.role = ? AND u.account_status = 'Active'
     LIMIT 1`,
    [targetRole]
  );

  if (demoUsers.length === 0) {
    return res.status(404).json({ success: false, message: `No active demo account found for ${targetRole}` });
  }

  const u = demoUsers[0];
  const token = jwt.sign(
    {
      id: u.id,
      employee_id: u.employee_id,
      email: u.work_email,
      role: u.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    message: `Switched active role to ${targetRole}`,
    token,
    user: {
      id: u.id,
      employee_id: u.employee_id,
      emp_code: u.emp_code,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.work_email,
      role: u.role,
      department_name: u.department_name
    }
  });
}

module.exports = {
  login,
  getMe,
  switchDemoRole
};
