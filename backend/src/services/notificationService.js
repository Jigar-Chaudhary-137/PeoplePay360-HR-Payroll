const { query } = require('../config/db');

/**
 * Creates and inserts a notification into the notifications table.
 * Guards against duplicate notifications within a short time window.
 *
 * @param {number} userId - ID of the recipient user in the `users` table
 * @param {string} title - Short descriptive title
 * @param {string} message - Detailed notification body
 * @param {'info'|'warning'|'success'|'error'} type - Notification severity/category
 * @returns {Promise<number|null>} - Inserted notification ID or null
 */
async function createNotification(userId, title, message, type = 'info') {
  if (!userId) return null;

  try {
    const validTypes = ['info', 'warning', 'success', 'error'];
    const safeType = validTypes.includes(type) ? type : 'info';

    // Duplicate prevention: check if identical notification was sent to this user within the last 5 minutes
    const existing = await query(
      `SELECT id FROM notifications 
       WHERE user_id = ? AND title = ? AND message = ? AND created_at >= NOW() - INTERVAL 5 MINUTE
       LIMIT 1`,
      [userId, title, message]
    );

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, FALSE)`,
      [userId, title, message, safeType]
    );

    return result.insertId;
  } catch (error) {
    console.error('⚠️ Failed to create notification:', error.message);
    return null;
  }
}

/**
 * Notifies the user associated with a given employee ID.
 *
 * @param {number} employeeId - ID of the employee in the `employees` table
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {'info'|'warning'|'success'|'error'} type - Notification type
 * @returns {Promise<number|null>}
 */
async function notifyEmployee(employeeId, title, message, type = 'info') {
  if (!employeeId) return null;

  try {
    const users = await query(
      'SELECT id FROM users WHERE employee_id = ? AND status = "Active" LIMIT 1',
      [employeeId]
    );

    if (!users || users.length === 0) {
      return null;
    }

    return await createNotification(users[0].id, title, message, type);
  } catch (error) {
    console.error(`⚠️ Failed to notify employee ID ${employeeId}:`, error.message);
    return null;
  }
}

/**
 * Notifies all active Admin, HR Payroll Admin, and HR Payroll User accounts.
 *
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {'info'|'warning'|'success'|'error'} type - Notification type
 * @param {number|null} [additionalUserId] - Optional user ID (e.g. payrun creator) to include
 * @returns {Promise<number[]>} - Array of created notification IDs
 */
async function notifyPayrollAdmins(title, message, type = 'info', additionalUserId = null) {
  try {
    const rows = await query(
      `SELECT u.id 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('Admin', 'HR Payroll Admin', 'HR Payroll User') 
         AND u.status = 'Active'`
    );

    const userIds = new Set(rows.map((r) => r.id));
    if (additionalUserId) {
      userIds.add(additionalUserId);
    }

    const createdIds = [];
    for (const uId of userIds) {
      const id = await createNotification(uId, title, message, type);
      if (id) createdIds.push(id);
    }

    return createdIds;
  } catch (error) {
    console.error('⚠️ Failed to notify payroll/admin users:', error.message);
    return [];
  }
}

module.exports = {
  createNotification,
  notifyEmployee,
  notifyPayrollAdmins
};
