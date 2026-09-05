const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026_hackathon';

// Authenticate JWT token from Authorization header
=======
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_hackathon_2026';

>>>>>>> feature/backend
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
<<<<<<< HEAD
      message: 'Authentication token required. Please login.'
=======
      message: 'Access denied. No token provided.'
>>>>>>> feature/backend
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
<<<<<<< HEAD
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
=======
    
    // Validate that user exists and is active in database
    const users = await query(
      `SELECT u.id, u.email, u.status, u.employee_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    const user = users[0];
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Contact your administrator.'
>>>>>>> feature/backend
      });
    }

    req.user = {
<<<<<<< HEAD
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
=======
      id: user.id,
      email: user.email,
      role: user.role_name,
      employee_id: user.employee_id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
>>>>>>> feature/backend
    });
  }
}

<<<<<<< HEAD
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
=======
module.exports = {
  authenticateToken,
>>>>>>> feature/backend
  JWT_SECRET
};
