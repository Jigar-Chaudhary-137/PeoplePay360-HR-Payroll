const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplepay360',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true
});

// Helper for executing parameterized queries
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Helper to acquire a transactional connection
async function getTransactionConnection() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

// Test connectivity
async function testConnection() {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    return { ok: true, solution: result[0].solution };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  pool,
  query,
  getTransactionConnection,
  testConnection
};
