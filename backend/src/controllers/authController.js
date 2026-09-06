const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

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

    const cleanEmail = email.trim().toLowerCase();

    const users = await query(
      `SELECT u.id, u.email, u.password_hash, u.status, u.employee_id,
              r.id AS role_id, r.name AS role_name,
              e.first_name, e.last_name, e.employee_code, e.avatar_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))
          OR LOWER(TRIM(e.email)) = LOWER(TRIM(?)) LIMIT 1`,
      [cleanEmail, cleanEmail]
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
      },
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

const DEMO_ROLE_EMAILS = {
  'Admin': 'admin@peoplepay360.com',
  'HR Manager': 'priya.patel@peoplepay360.com',
  'HR Payroll Admin': 'amit.singh@peoplepay360.com',
  'HR Payroll User': 'neha.gupta@peoplepay360.com',
  'Employee': 'rahul.sharma@peoplepay360.com'
};

async function switchDemoRole(req, res, next) {
  try {
    const { targetRole } = req.body;
    let email = DEMO_ROLE_EMAILS[targetRole];

    if (!email && targetRole === 'HR Payroll User') {
      email = 'neha.gupta@peoplepay360.com';
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: `Invalid demo role: ${targetRole}. Allowed roles: ${Object.keys(DEMO_ROLE_EMAILS).join(', ')}`
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const users = await query(
      `SELECT u.id, u.email, u.status, u.employee_id,
              r.id AS role_id, r.name AS role_name,
              e.first_name, e.last_name, e.employee_code, e.avatar_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))
          OR LOWER(TRIM(e.email)) = LOWER(TRIM(?)) LIMIT 1`,
      [cleanEmail, cleanEmail]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Demo user for role ${targetRole} not found in database.`
      });
    }

    const user = users[0];
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Demo account ${email} is inactive.`
      });
    }

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

    await logAudit(user.id, 'DEMO_ROLE_SWITCH', 'user', user.id, { targetRole, email });

    return res.json({
      success: true,
      message: `Switched session to ${user.role_name} demo account (${email}).`,
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
      },
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

/**
 * Initiates secure password reset flow by sending a reset email.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Work email address is required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary lookup: Check users joined with employees
    // Uses actual email columns (u.email, e.email) and database relationship (u.employee_id = e.id)
    const users = await query(
      `SELECT u.id AS user_id, u.email AS user_email, u.status AS user_status, u.employee_id, u.role_id,
              e.id AS emp_id, e.first_name, e.last_name, e.email AS employee_email, e.employment_status
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))
          OR LOWER(TRIM(e.email)) = LOWER(TRIM(?))
       LIMIT 1`,
      [cleanEmail, cleanEmail]
    );

    let targetUser = null;

    if (users && users.length > 0) {
      const u = users[0];

      if (u.user_status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'This account is currently inactive. Please contact your system administrator.'
        });
      }

      if (u.employment_status && u.employment_status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'This employee profile is currently inactive. Please contact your HR administrator.'
        });
      }

      // If user had no employee_id linked, check if an employee matches this email and link them
      if (!u.employee_id) {
        const matchingEmployees = await query(
          'SELECT id, first_name, last_name, employment_status FROM employees WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
          [cleanEmail]
        );
        if (matchingEmployees && matchingEmployees.length > 0) {
          if (matchingEmployees[0].employment_status && matchingEmployees[0].employment_status !== 'Active') {
            return res.status(403).json({
              success: false,
              message: 'This employee profile is currently inactive. Please contact your HR administrator.'
            });
          }
          await query('UPDATE users SET employee_id = ? WHERE id = ?', [matchingEmployees[0].id, u.user_id]);
          u.first_name = matchingEmployees[0].first_name;
          u.last_name = matchingEmployees[0].last_name;
        }
      }

      targetUser = {
        id: u.user_id,
        email: u.user_email || cleanEmail,
        first_name: u.first_name,
        last_name: u.last_name
      };
    } else {
      // 2. Secondary lookup: Check employees table directly
      // If an existing employee has not had a user record provisioned yet, provision one without creating duplicates
      const employees = await query(
        `SELECT id, employee_code, first_name, last_name, email, employment_status
         FROM employees
         WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
         LIMIT 1`,
        [cleanEmail]
      );

      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No registered account found with that email address.'
        });
      }

      const emp = employees[0];

      if (emp.employment_status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'This account is currently inactive. Please contact your system administrator.'
        });
      }

      // Check if a user record already exists for this employee to prevent duplicate users
      const existingUser = await query(
        'SELECT id, email, status FROM users WHERE employee_id = ? OR LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
        [emp.id, emp.email]
      );

      if (existingUser && existingUser.length > 0) {
        if (existingUser[0].status !== 'Active') {
          return res.status(403).json({
            success: false,
            message: 'This account is currently inactive. Please contact your system administrator.'
          });
        }
        targetUser = {
          id: existingUser[0].id,
          email: existingUser[0].email,
          first_name: emp.first_name,
          last_name: emp.last_name
        };
      } else {
        // Securely provision user account with role_id: 5 ('Employee') and a temporary placeholder bcrypt hash
        const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const insertResult = await query(
          `INSERT INTO users (employee_id, email, password_hash, role_id, status)
           VALUES (?, ?, ?, 5, 'Active')`,
          [emp.id, emp.email.trim(), placeholderHash]
        );

        targetUser = {
          id: insertResult.insertId,
          email: emp.email.trim(),
          first_name: emp.first_name,
          last_name: emp.last_name
        };
      }
    }

    // Generate secure cryptographic token (32 random bytes -> SHA-256 hash)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Invalidate previous unconsumed tokens for this user
    await query(
      'UPDATE password_resets SET used = TRUE WHERE user_id = ? AND used = FALSE',
      [targetUser.id]
    );

    // Save token record into password_resets
    await query(
      `INSERT INTO password_resets (user_id, email, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [targetUser.id, targetUser.email, tokenHash, expiresAt]
    );

    // Construct frontend reset URL
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(targetUser.email)}`;

    const recipientName = targetUser.first_name
      ? `${targetUser.first_name} ${targetUser.last_name || ''}`.trim()
      : (targetUser.email === 'admin@peoplepay360.com' ? 'Administrator' : 'Team Member');

    // Dispatch real email via Nodemailer
    const emailResult = await sendPasswordResetEmail(
      targetUser.email,
      recipientName,
      resetUrl
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver the password reset email. Please verify mail server configuration.'
      });
    }

    await logAudit(targetUser.id, 'FORGOT_PASSWORD_REQUEST', 'user', targetUser.id, { email: targetUser.email });

    // Do NOT expose reset token in response or logs
    return res.json({
      success: true,
      message: 'Password reset link sent to your work email address.',
      previewUrl: emailResult.previewUrl || undefined
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your password reset request. Please try again.'
    });
  }
}

/**
 * Validates reset token and updates the user's password.
 */
async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Find active valid token
    const [resetRecord] = await query(
      `SELECT * FROM password_resets 
       WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND token_hash = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, tokenHash]
    );

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Hash the new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, resetRecord.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_resets SET used = TRUE WHERE id = ?',
      [resetRecord.id]
    );

    await logAudit(resetRecord.user_id, 'PASSWORD_RESET_SUCCESS', 'user', resetRecord.user_id, { email: cleanEmail });

    return res.json({
      success: true,
      message: 'Your password has been successfully reset. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
}

/**
 * Validates if a token is valid before showing the reset password form.
 */
async function verifyResetToken(req, res, next) {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Email and token are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [resetRecord] = await query(
      `SELECT id FROM password_resets 
       WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND token_hash = ? AND used = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [cleanEmail, tokenHash]
    );

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This reset link is invalid or has expired.'
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: 'Reset token is valid.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  switchDemoRole,
  forgotPassword,
  resetPassword,
  verifyResetToken
};

