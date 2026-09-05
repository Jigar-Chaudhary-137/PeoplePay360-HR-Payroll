const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026_hackathon';

// Authenticate JWT token from Authorization header
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please login.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user exists and is active
    const users = await query(
      `SELECT u.id, u.employee_id, u.work_email, u.role, u.account_status,
              e.first_name, e.last_name, e.department_id, e.emp_code
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = ? AND u.account_status = 'Active'`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user account.'
      });
    }

    req.user = {
      id: users[0].id,
      employee_id: users[0].employee_id,
      emp_code: users[0].emp_code,
      email: users[0].work_email,
      role: users[0].role,
      first_name: users[0].first_name,
      last_name: users[0].last_name,
      department_id: users[0].department_id
    };
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
}

// Role-based authorization middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.'
      });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === 'Admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role "${req.user.role}" does not have permission to perform this action.`
    });
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
