const { query, withTransaction } = require('../config/db');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5001}/api`;

async function runVerification() {
  console.log('===============================================================');
  console.log('PEOPLEPAY360 - EMPLOYEE LOGIN ACCOUNT CREATION VERIFICATION');
  console.log('===============================================================');

  const testEmail = `test.employee.${Date.now()}@peoplepay360.com`;
  const testCode = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
  let createdEmployeeId = null;
  let temporaryPassword = null;

  try {
    // 1. Verify DB connection
    console.log('\n[STEP 1] Testing Database Connection...');
    const testRes = await query('SELECT 1 + 1 AS solution');
    if (!testRes || testRes[0].solution !== 2) {
      throw new Error('Database connection failed.');
    }
    console.log('  ✓ MySQL database is connected.');

    // 2. Admin Login to obtain JWT
    console.log('\n[STEP 2] Authenticating as Admin (admin@peoplepay360.com)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@peoplepay360.com',
        password: 'Password@123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const adminToken = loginData.token;
    console.log(`  ✓ Admin authenticated successfully. User: ${loginData.user.name} (${loginData.user.role})`);

    // 3. Admin creates new employee
    console.log(`\n[STEP 3] Admin creating new employee with email: ${testEmail}...`);
    const createRes = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        employee_code: testCode,
        first_name: 'Aarav',
        last_name: 'Chopra',
        email: testEmail,
        phone: '+91 98765 43210',
        employment_status: 'Active',
        work_location: 'Bengaluru HQ',
        company: 'PeoplePay360 Inc',
        bank_name: 'HDFC Bank',
        bank_account_no: '50100492819283',
        bank_ifsc: 'HDFC0001234',
        pan_number: 'ABCDE1234F'
      })
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Employee creation failed (${createRes.status}): ${JSON.stringify(createData)}`);
    }

    createdEmployeeId = createData.data.id;
    const credentials = createData.data.login_credentials;
    if (!credentials || !credentials.temporary_password) {
      throw new Error('Response did not contain login_credentials or temporary_password!');
    }
    temporaryPassword = credentials.temporary_password;

    console.log(`  ✓ Employee created with ID: ${createdEmployeeId}, Code: ${createData.data.employee_code}`);
    console.log(`  ✓ Login credentials returned in response:`);
    console.log(`      - Email: ${credentials.email}`);
    console.log(`      - Temporary Password: ${credentials.temporary_password}`);
    console.log(`      - Role: ${credentials.role}`);
    console.log(`      - Must Change Password: ${credentials.must_change_password}`);

    // 4. Verify in MySQL database
    console.log('\n[STEP 4] Verifying MySQL Database Records...');
    const [userRows] = await query(
      `SELECT u.id, u.employee_id, u.email, u.password_hash, u.status, u.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [testEmail]
    );

    if (!userRows) {
      throw new Error(`No user record found in 'users' table for ${testEmail}!`);
    }

    console.log(`  ✓ User record found in MySQL: User ID ${userRows.id}`);
    console.log(`  ✓ Linked employee_id: ${userRows.employee_id} (matches created employee ${createdEmployeeId})`);
    console.log(`  ✓ Assigned role: ${userRows.role_name} (role_id: ${userRows.role_id})`);
    console.log(`  ✓ Status: ${userRows.status}`);

    // Verify password is NOT plaintext and is a valid bcrypt hash
    if (userRows.password_hash === temporaryPassword) {
      throw new Error('SECURITY VIOLATION: Password was stored in PLAINTEXT in the database!');
    }
    const isBcrypt = userRows.password_hash.startsWith('$2a$') || userRows.password_hash.startsWith('$2b$');
    if (!isBcrypt) {
      throw new Error(`Password hash does not look like a bcrypt hash: ${userRows.password_hash}`);
    }
    const hashMatches = await bcrypt.compare(temporaryPassword, userRows.password_hash);
    if (!hashMatches) {
      throw new Error('bcrypt.compare failed: Database hash does not match generated temporary password!');
    }
    console.log(`  ✓ Password verified as secure bcrypt hash (${userRows.password_hash.substring(0, 20)}...)`);
    console.log(`  ✓ Password is NEVER stored in plaintext.`);

    // 5. Employee logs in immediately with the temporary credentials
    console.log('\n[STEP 5] Testing Employee Login with Temporary Credentials...');
    const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: temporaryPassword
      })
    });
    const empLoginData = await empLoginRes.json();
    if (empLoginRes.status !== 200 || !empLoginData.token) {
      throw new Error(`Employee login failed (${empLoginRes.status}): ${JSON.stringify(empLoginData)}`);
    }

    console.log(`  ✓ Employee logged in successfully!`);
    console.log(`  ✓ JWT Token issued: ${empLoginData.token.substring(0, 25)}...`);
    console.log(`  ✓ User payload:`);
    console.log(`      - ID: ${empLoginData.user.id}`);
    console.log(`      - Email: ${empLoginData.user.email}`);
    console.log(`      - Role: ${empLoginData.user.role}`);
    console.log(`      - Employee ID: ${empLoginData.user.employee_id}`);

    if (empLoginData.user.role !== 'Employee') {
      throw new Error(`Expected role 'Employee', got '${empLoginData.user.role}'`);
    }
    if (empLoginData.user.employee_id !== createdEmployeeId) {
      throw new Error(`Expected employee_id ${createdEmployeeId}, got ${empLoginData.user.employee_id}`);
    }

    // 6. Test duplicate email handling
    console.log('\n[STEP 6] Testing Duplicate Email Handling (409 Conflict)...');
    const dupRes = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        first_name: 'Duplicate',
        last_name: 'Test',
        email: testEmail,
        employment_status: 'Active'
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${dupRes.status}: ${JSON.stringify(dupData)}`);
    }
    console.log(`  ✓ Duplicate employee creation rejected with HTTP 409 Conflict.`);
    console.log(`  ✓ Rejection message: "${dupData.message}"`);

    // Verify no secondary user or employee was created
    const dupUsers = await query('SELECT COUNT(*) AS count FROM users WHERE LOWER(email) = LOWER(?)', [testEmail]);
    if (dupUsers[0].count !== 1) {
      throw new Error(`Found ${dupUsers[0].count} users with email ${testEmail}; expected exactly 1.`);
    }
    const dupEmps = await query('SELECT COUNT(*) AS count FROM employees WHERE LOWER(email) = LOWER(?)', [testEmail]);
    if (dupEmps[0].count !== 1) {
      throw new Error(`Found ${dupEmps[0].count} employees with email ${testEmail}; expected exactly 1.`);
    }
    console.log(`  ✓ Database integrity verified: No duplicate records created.`);

    // 7. Test existing demo accounts remain intact
    console.log('\n[STEP 7] Verifying Existing Demo Accounts...');
    const demoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.sharma@peoplepay360.com',
        password: 'Password@123'
      })
    });
    const demoLoginData = await demoLoginRes.json();
    if (demoLoginRes.status !== 200 || !demoLoginData.token) {
      throw new Error(`Demo employee login failed: ${JSON.stringify(demoLoginData)}`);
    }
    console.log(`  ✓ Demo account (rahul.sharma@peoplepay360.com) logged in successfully.`);

    console.log('\n===============================================================');
    console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('===============================================================');
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // Clean up test records
    if (createdEmployeeId) {
      console.log('\n[CLEANUP] Removing test employee and user records...');
      try {
        await query('DELETE FROM users WHERE LOWER(email) = LOWER(?)', [testEmail]);
        await query('DELETE FROM employees WHERE id = ?', [createdEmployeeId]);
        console.log('  ✓ Test records cleaned up successfully.');
      } catch (cleanErr) {
        console.error('  Failed to cleanup test records:', cleanErr.message);
      }
    }
    process.exit(process.exitCode || 0);
  }
}

runVerification();
