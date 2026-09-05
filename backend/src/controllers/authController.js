const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const users = await query(
      `SELECT u.id, u.email, u.password_hash, u.status, u.employee_id,
              r.id AS role_id, r.name AS role_name,
              e.first_name, e.last_name, e.employee_code, e.avatar_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE LOWER(u.email) = LOWER(?) LIMIT 1`,
      [email.trim()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the system administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role_name,
        employeeId: user.employee_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAudit(user.id, 'USER_LOGIN', 'user', user.id, { email: user.email });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role_name,
          employee_id: user.employee_id,
          name: user.first_name ? `${user.first_name} ${user.last_name}` : 'Administrator',
          first_name: user.first_name || (user.role_name === 'Admin' ? 'Admin' : ''),
          last_name: user.last_name || '',
          employee_code: user.employee_code,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const users = await query(
      `SELECT u.id, u.email, u.status, u.employee_id,
              r.id AS role_id, r.name AS role_name,
              e.first_name, e.last_name, e.employee_code, e.avatar_url,
              d.name AS department_name, jp.title AS job_position_title
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE u.id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const u = users[0];
    return res.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        role: u.role_name,
        status: u.status,
        employee_id: u.employee_id,
        name: u.first_name ? `${u.first_name} ${u.last_name}` : 'Administrator',
        employee_code: u.employee_code,
        avatar_url: u.avatar_url,
        department: u.department_name,
        job_position: u.job_position_title
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe
};
