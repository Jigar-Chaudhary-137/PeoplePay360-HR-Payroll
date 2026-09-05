const { query } = require('../config/db');

async function logAudit(userId, action, entityType, entityId, details = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entityType, entityId || null, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('⚠️ Failed to write audit log:', error.message);
  }
}

module.exports = {
  logAudit
};
