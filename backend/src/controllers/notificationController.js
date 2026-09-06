const { query } = require('../config/db');

async function getNotifications(req, res) {
  const userId = req.user.id;
  const notifications = await query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return res.json({ success: true, data: notifications });
}

async function markAsRead(req, res) {
  const { id } = req.params;
  await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
  return res.json({ success: true, message: 'Notification marked as read.' });
}

async function markAllRead(req, res) {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
  return res.json({ success: true, message: 'All notifications marked as read.' });
}

async function getUnreadCount(req, res) {
  const userId = req.user.id;
  const [result] = await query(
    'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return res.json({ success: true, data: { unreadCount: result ? result.unreadCount : 0 } });
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead
};
