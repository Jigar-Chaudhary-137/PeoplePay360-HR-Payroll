const mysql = require('mysql2/promise');
<<<<<<< HEAD
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
=======
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
>>>>>>> feature/backend
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplepay360',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
<<<<<<< HEAD
  decimalNumbers: true
};

let pool = null;

async function initDatabase() {
  try {
    // 1. Create database if it doesn't exist
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // 2. Initialize connection pool
    pool = mysql.createPool(dbConfig);

    // 3. Test pool connection
    const testConn = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database "${dbConfig.database}"`);
    testConn.release();

    // 4. Initialize schema if tables don't exist
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

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function query(sql, params) {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

async function withTransaction(callback) {
  const p = getPool();
  const connection = await p.getConnection();
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
=======
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
>>>>>>> feature/backend
  }
}

module.exports = {
<<<<<<< HEAD
  initDatabase,
  getPool,
  query,
  withTransaction
=======
  pool,
  query,
  getTransactionConnection,
  testConnection
>>>>>>> feature/backend
};
