const { query } = require('../config/db');

async function getAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const rows = await query(
      `SELECT al.*, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs
};
