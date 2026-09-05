const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_hackathon_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
      });
    }

    req.user = {
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
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
