const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function initDb() {
  console.log('🔄 Initializing PeoplePay360 Database...');
  console.log(`📡 Connecting to MySQL server at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} as ${process.env.DB_USER || 'root'}...`);

  let rootConnection;
  try {
    // 1. Connect without selecting database to ensure database exists
    rootConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'peoplepay360';
    console.log(`🏗️ Freshly initializing database '${dbName}'...`);
    await rootConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    await rootConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    // 2. Connect with multipleStatements: true to run schema.sql and seed.sql
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      multipleStatements: true
    });

    console.log('📄 Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
    await dbConnection.query(schemaSql);
    console.log('✅ Tables and constraints created successfully.');

    console.log('🌱 Executing seed.sql...');
    const seedSql = fs.readFileSync(path.resolve(__dirname, 'seed.sql'), 'utf-8');
    await dbConnection.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    // Count records to verify
    const [roles] = await dbConnection.query('SELECT COUNT(*) as count FROM roles');
    const [employees] = await dbConnection.query('SELECT COUNT(*) as count FROM employees');
    const [contracts] = await dbConnection.query('SELECT COUNT(*) as count FROM contracts');
    const [rules] = await dbConnection.query('SELECT COUNT(*) as count FROM salary_rules');
    const [payruns] = await dbConnection.query('SELECT COUNT(*) as count FROM payruns');

    console.log('============================================');
    console.log('🎉 PEOPLEPAY360 DATABASE READY!');
    console.log(`- Roles: ${roles[0].count}`);
    console.log(`- Employees: ${employees[0].count}`);
    console.log(`- Contracts: ${contracts[0].count}`);
    console.log(`- Salary Rules: ${rules[0].count}`);
    console.log(`- Payruns: ${payruns[0].count}`);
    console.log('============================================');

    await dbConnection.end();
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('⚠️ Authentication failed. Please check DB_USER and DB_PASSWORD in backend/.env');
    }
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
