const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplepay360',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true
};

const pool = mysql.createPool(dbConfig);

function getPool() {
  return pool;
}

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

// Helper for wrapping operations inside a managed transaction
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

// Initialize database & schema if required
async function initDatabase() {
  try {
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const conn = await mysql.createConnection({
        ...dbConfig,
        multipleStatements: true
      });
      await conn.query(schemaSql);
      await conn.end();
      console.log('[Database] Schema verified and updated successfully.');
    }

    return pool;
  } catch (err) {
    console.error('[Database] Connection/Init Error:', err.message);
    throw err;
  }
}

module.exports = {
  pool,
  getPool,
  initDatabase,
  query,
  withTransaction,
  getTransactionConnection,
  testConnection
};
