const { query } = require('./config/db');

const BASE_URL = 'http://localhost:5001';

async function request(method, path, body = null, token = null) {
  const url = BASE_URL + path;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      data
    };
  } catch (err) {
    throw new Error(`Fetch error on ${method} ${path}: ${err.message}`);
  }
}

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(testName, details = '') {
  results.passed.push({ testName, details });
  console.log(`  [PASS] ${testName}${details ? ' - ' + details : ''}`);
}

function fail(testName, error) {
  results.failed.push({ testName, error });
  console.error(`  [FAIL] ${testName}:`, error);
}

function warn(testName, warning) {
  results.warnings.push({ testName, warning });
  console.warn(`  [WARN] ${testName}:`, warning);
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 STARTING PEOPLEPAY360 COMPLETE END-TO-END AUDIT');
  console.log('====================================================\n');

  // --- 1. AUTHENTICATION & RBAC ---
  console.log('1. Testing Authentication & RBAC...');
  const roles = [
    { name: 'Admin', email: 'admin@peoplepay360.com', password: 'Password@123' },
    { name: 'HR Manager', email: 'priya.patel@peoplepay360.com', password: 'Password@123' },
    { name: 'Payroll Admin', email: 'amit.singh@peoplepay360.com', password: 'Password@123' },
    { name: 'Employee', email: 'rahul.sharma@peoplepay360.com', password: 'Password@123' }
  ];

  const tokens = {};

  for (const r of roles) {
    try {
      const res = await request('POST', '/api/auth/login', { email: r.email, password: r.password });
      if (res.status === 200 && res.data.success && res.data.token) {
        tokens[r.name] = res.data.token;
        pass(`Login for ${r.name}`, `User ID: ${res.data.user.id}, Role: ${res.data.user.role || res.data.user.role_name}`);
      } else {
        fail(`Login for ${r.name}`, res.data.message || `HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`Login for ${r.name}`, e.message);
    }
  }

  // Verify /api/auth/me for each
  for (const r of roles) {
    if (tokens[r.name]) {
      try {
        const meRes = await request('GET', '/api/auth/me', null, tokens[r.name]);
        if (meRes.status === 200 && meRes.data.success) {
          pass(`/api/auth/me for ${r.name}`);
        } else {
          fail(`/api/auth/me for ${r.name}`, `Status ${meRes.status}`);
        }
      } catch (e) {
        fail(`/api/auth/me for ${r.name}`, e.message);
      }
    }
  }

  // Verify RBAC protection: Employee attempting Admin endpoint (/api/users)
  try {
    const rbacRes = await request('GET', '/api/users', null, tokens['Employee']);
    if (rbacRes.status === 403) {
      pass('RBAC: Employee blocked from /api/users (403 Forbidden)');
    } else {
      fail('RBAC: Employee access to /api/users', `Expected 403, got ${rbacRes.status}`);
    }
  } catch (e) {
    fail('RBAC check', e.message);
  }

  // Admin access to /api/users
  try {
    const adminRes = await request('GET', '/api/users', null, tokens['Admin']);
    if (adminRes.status === 200 && adminRes.data.success) {
      pass('RBAC: Admin granted access to /api/users', `Retrieved ${(adminRes.data.data || []).length} system users`);
    } else {
      fail('RBAC: Admin access to /api/users', `Status ${adminRes.status}`);
    }
  } catch (e) {
    fail('Admin users check', e.message);
  }

  const adminToken = tokens['Admin'];

  // --- 2. HR MODULES: EMPLOYEES, DEPARTMENTS, POSITIONS ---
  console.log('\n2. Testing HR Modules (Employees, Departments, Positions)...');
  try {
    const empRes = await request('GET', '/api/employees', null, adminToken);
    if (empRes.status === 200 && empRes.data.success && Array.isArray(empRes.data.data)) {
      const emps = empRes.data.data;
      pass('GET /api/employees', `Retrieved ${emps.length} employees`);

      // Check single employee details (e.g. employee 101 or first employee)
      const testEmp = emps.find(e => e.id === 101) || emps[0];
      if (testEmp) {
        const singleEmpRes = await request('GET', `/api/employees/${testEmp.id}`, null, adminToken);
        if (singleEmpRes.status === 200 && singleEmpRes.data.success) {
          pass(`GET /api/employees/${testEmp.id} (${testEmp.first_name} ${testEmp.last_name})`, 'Details loaded with relationships');
        } else {
          fail(`GET /api/employees/${testEmp.id}`, `Status ${singleEmpRes.status}`);
        }
      }
    } else {
      fail('GET /api/employees', `Status ${empRes.status}`);
    }
  } catch (e) {
    fail('GET /api/employees', e.message);
  }

  // Departments
  try {
    const deptRes = await request('GET', '/api/departments', null, adminToken);
    if (deptRes.status === 200 && deptRes.data.success) {
      pass('GET /api/departments', `Retrieved ${(deptRes.data.data || []).length} departments`);
    } else {
      fail('GET /api/departments', `Status ${deptRes.status}`);
    }
  } catch (e) {
    fail('GET /api/departments', e.message);
  }

  // Work Locations
  try {
    const locRes = await request('GET', '/api/work-locations', null, adminToken);
    if (locRes.status === 200 && locRes.data.success) {
      pass('GET /api/work-locations', `Retrieved ${(locRes.data.data || []).length} work locations`);
    } else {
      fail('GET /api/work-locations', `Status ${locRes.status}`);
    }
  } catch (e) {
    fail('GET /api/work-locations', e.message);
  }

  // --- 3. CONTRACTS & SCHEDULES ---
  console.log('\n3. Testing Contracts & Working Schedules...');
  try {
    const contRes = await request('GET', '/api/contracts', null, adminToken);
    if (contRes.status === 200 && contRes.data.success) {
      const contracts = contRes.data.data || [];
      pass('GET /api/contracts', `Retrieved ${contracts.length} contracts`);
    } else {
      fail('GET /api/contracts', `Status ${contRes.status}`);
    }
  } catch (e) {
    fail('GET /api/contracts', e.message);
  }

  try {
    const schedRes = await request('GET', '/api/schedules', null, adminToken);
    if (schedRes.status === 200 && schedRes.data.success) {
      const schedules = schedRes.data.data || [];
      pass('GET /api/schedules', `Retrieved ${schedules.length} schedules`);
      for (const s of schedules) {
        if (s.days && s.days.length > 0) {
          pass(`Schedule #${s.id} (${s.name})`, `${s.days.length} shift days configured`);
        } else {
          warn(`Schedule #${s.id} (${s.name})`, '0 shift days configured');
        }
      }
    } else {
      fail('GET /api/schedules', `Status ${schedRes.status}`);
    }
  } catch (e) {
    fail('GET /api/schedules', e.message);
  }

  // --- 4. ATTENDANCE & TIME OFF ---
  console.log('\n4. Testing Attendance & Time Off...');
  try {
    const attRes = await request('GET', '/api/attendance', null, adminToken);
    if (attRes.status === 200 && attRes.data.success) {
      pass('GET /api/attendance', `Retrieved ${(attRes.data.data || []).length} attendance records`);
    } else {
      fail('GET /api/attendance', `Status ${attRes.status}`);
    }
  } catch (e) {
    fail('GET /api/attendance', e.message);
  }

  try {
    const attSumRes = await request('GET', '/api/attendance/summary/today', null, adminToken);
    if (attSumRes.status === 200 && attSumRes.data.success) {
      pass('GET /api/attendance/summary/today', JSON.stringify(attSumRes.data.data));
    } else {
      fail('GET /api/attendance/summary/today', `Status ${attSumRes.status}`);
    }
  } catch (e) {
    fail('GET /api/attendance/summary/today', e.message);
  }

  try {
    const toTypesRes = await request('GET', '/api/time-off/types', null, adminToken);
    if (toTypesRes.status === 200 && toTypesRes.data.success) {
      pass('GET /api/time-off/types', `Retrieved ${(toTypesRes.data.data || []).length} leave types`);
    } else {
      fail('GET /api/time-off/types', `Status ${toTypesRes.status}`);
    }

    const toReqRes = await request('GET', '/api/time-off/requests', null, adminToken);
    if (toReqRes.status === 200 && toReqRes.data.success) {
      pass('GET /api/time-off/requests', `Retrieved ${(toReqRes.data.data || []).length} time off requests`);
    } else {
      fail('GET /api/time-off/requests', `Status ${toReqRes.status}`);
    }
  } catch (e) {
    fail('Time Off endpoints', e.message);
  }

  // --- 5. PAYROLL CONFIGURATION & PAYRUNS ---
  console.log('\n5. Testing Payroll Calculation, Payruns & Payslips...');
  try {
    const structRes = await request('GET', '/api/salary-config/structures', null, adminToken);
    if (structRes.status === 200 && structRes.data.success) {
      pass('GET /api/salary-config/structures', `Retrieved ${(structRes.data.data || []).length} salary structures`);
    } else {
      fail('GET /api/salary-config/structures', `Status ${structRes.status}`);
    }

    const rulesRes = await request('GET', '/api/salary-config/rules', null, adminToken);
    if (rulesRes.status === 200 && rulesRes.data.success) {
      const rules = rulesRes.data.data || [];
      pass('GET /api/salary-config/rules', `Retrieved ${rules.length} sequential salary rules`);
      // Verify rule codes
      const codes = rules.map(r => r.code);
      const expectedCodes = ['BASIC', 'HRA', 'TRANS', 'SPECIAL', 'GROSS', 'PF', 'PT', 'TDS', 'NET'];
      const missingCodes = expectedCodes.filter(c => !codes.includes(c));
      if (missingCodes.length === 0) {
        pass('Salary Rule Sequence', 'All required statutory & compensation rule codes present');
      } else {
        warn('Salary Rule Sequence', `Missing codes: ${missingCodes.join(', ')}`);
      }
    } else {
      fail('GET /api/salary-config/rules', `Status ${rulesRes.status}`);
    }
  } catch (e) {
    fail('Salary config endpoints', e.message);
  }

  // Payruns
  let testPayrunId = null;
  try {
    const prRes = await request('GET', '/api/payruns', null, adminToken);
    if (prRes.status === 200 && prRes.data.success) {
      const payruns = prRes.data.data || [];
      pass('GET /api/payruns', `Retrieved ${payruns.length} payruns`);
      if (payruns.length > 0) {
        testPayrunId = payruns[0].id;
        const prDetail = await request('GET', `/api/payruns/${testPayrunId}`, null, adminToken);
        if (prDetail.status === 200 && prDetail.data.success) {
          const pr = prDetail.data.data;
          pass(`GET /api/payruns/${testPayrunId}`, `State: ${pr.state || pr.status}, Total Gross: ₹${pr.total_gross || 0}, Net: ₹${pr.total_net || 0}`);
        } else {
          fail(`GET /api/payruns/${testPayrunId}`, `Status ${prDetail.status}`);
        }
      }
    } else {
      fail('GET /api/payruns', `Status ${prRes.status}`);
    }

    // Test Eligible Employees endpoint
    const eligRes = await request('GET', '/api/payruns/eligible-employees?salary_structure_id=1&period_start=2026-09-01&period_end=2026-09-30', null, adminToken);
    if (eligRes.status === 200 && eligRes.data.success && Array.isArray(eligRes.data.data)) {
      pass('GET /api/payruns/eligible-employees', `Found ${eligRes.data.data.length} eligible active employees for Structure #1`);
    } else {
      fail('GET /api/payruns/eligible-employees', `Status ${eligRes.status}`);
    }

    // Payrun Lifecycle: Test Compute on Payrun 5 (Draft -> Computed)
    try {
      const compRes = await request('POST', '/api/payruns/5/compute', {}, adminToken);
      if (compRes.status === 200 && compRes.data.success) {
        const pr = compRes.data.data?.payrun || compRes.data.data;
        pass('POST /api/payruns/5/compute (Draft -> Computed)', `Computed Total Gross: ₹${pr.total_gross}, Net: ₹${pr.total_net}`);
      } else {
        fail('POST /api/payruns/5/compute', compRes.data.message || `Status ${compRes.status}`);
      }
    } catch (e) {
      fail('Compute Payrun 5', e.message);
    }

    // Payrun Lifecycle: Test Validate on Payrun 5 (Computed -> Validated)
    try {
      const valRes = await request('POST', '/api/payruns/5/validate', {}, adminToken);
      if (valRes.status === 200 && valRes.data.success) {
        pass('POST /api/payruns/5/validate (Computed -> Validated)', 'Payrun locked and validated');
      } else {
        fail('POST /api/payruns/5/validate', valRes.data.message || `Status ${valRes.status}`);
      }
    } catch (e) {
      fail('Validate Payrun 5', e.message);
    }

    // Payrun Lifecycle: Test Mark Paid on Payrun 5 (Validated -> Paid)
    try {
      const paidRes = await request('POST', '/api/payruns/5/mark-paid', {}, adminToken);
      if (paidRes.status === 200 && paidRes.data.success) {
        pass('POST /api/payruns/5/mark-paid (Validated -> Paid)', 'Payrun marked as paid');
      } else {
        fail('POST /api/payruns/5/mark-paid', paidRes.data.message || `Status ${paidRes.status}`);
      }
    } catch (e) {
      fail('Mark Paid Payrun 5', e.message);
    }
  } catch (e) {
    fail('Payruns check', e.message);
  }

  // Payslips & Email Dispatch
  let testPayslipId = null;
  try {
    const psRes = await request('GET', '/api/payslips', null, adminToken);
    if (psRes.status === 200 && psRes.data.success) {
      const payslips = psRes.data.data || [];
      pass('GET /api/payslips', `Retrieved ${payslips.length} payslips`);
      if (payslips.length > 0) {
        testPayslipId = payslips[0].id;
        const psDetail = await request('GET', `/api/payslips/${testPayslipId}`, null, adminToken);
        if (psDetail.status === 200 && psDetail.data.success) {
          const p = psDetail.data.data;
          pass(`GET /api/payslips/${testPayslipId}`, `Employee: ${p.first_name} ${p.last_name}, Net: ₹${p.net_salary}, Lines: ${(p.lines || []).length}`);

          // PDF generation endpoint check
          const pdfRes = await request('GET', `/api/payslips/${testPayslipId}/pdf`, null, adminToken);
          if (pdfRes.status === 200) {
            pass(`Payslip PDF Generation #${testPayslipId}`, `Content-Type: ${pdfRes.headers['content-type']}`);
          } else {
            fail(`Payslip PDF Generation #${testPayslipId}`, `Status ${pdfRes.status}`);
          }

          // Email dispatch endpoint check
          const emailRes = await request('POST', `/api/payslips/${testPayslipId}/send`, {}, adminToken);
          if (emailRes.status === 200 && emailRes.data.success) {
            pass(`Payslip Email Dispatch #${testPayslipId}`, `Dispatched to employee email (${emailRes.data.message})`);
          } else {
            fail(`Payslip Email Dispatch #${testPayslipId}`, emailRes.data.message || `Status ${emailRes.status}`);
          }
        } else {
          fail(`GET /api/payslips/${testPayslipId}`, `Status ${psDetail.status}`);
        }
      }
    } else {
      fail('GET /api/payslips', `Status ${psRes.status}`);
    }
  } catch (e) {
    fail('Payslips check', e.message);
  }

  // --- 6. DASHBOARDS, NOTIFICATIONS & AUDIT LOGS ---
  console.log('\n6. Testing Dashboards, Notifications & Audit Logs...');
  try {
    const dashRes = await request('GET', '/api/dashboard', null, adminToken);
    if (dashRes.status === 200 && dashRes.data.success) {
      const d = dashRes.data.data;
      const k = d.kpis || d.metrics || d;
      pass('GET /api/dashboard', `KPIs - Total Employees: ${k.totalEmployees || k.total_employees}, Total Payroll: ₹${k.totalNetPaid || k.total_payroll || 0}`);
    } else {
      fail('GET /api/dashboard', `Status ${dashRes.status}`);
    }
  } catch (e) {
    fail('GET /api/dashboard', e.message);
  }

  try {
    const notifRes = await request('GET', '/api/notifications', null, adminToken);
    if (notifRes.status === 200 && notifRes.data.success) {
      pass('GET /api/notifications', `Retrieved ${(notifRes.data.data || []).length} notifications`);
    } else {
      fail('GET /api/notifications', `Status ${notifRes.status}`);
    }

    const unreadRes = await request('GET', '/api/notifications/unread-count', null, adminToken);
    if (unreadRes.status === 200 && unreadRes.data.success) {
      pass('GET /api/notifications/unread-count', `Unread count: ${unreadRes.data.data?.unreadCount ?? unreadRes.data.data}`);
    } else {
      fail('GET /api/notifications/unread-count', `Status ${unreadRes.status}`);
    }
  } catch (e) {
    fail('Notifications check', e.message);
  }

  try {
    const auditRes = await request('GET', '/api/audit-logs', null, adminToken);
    if (auditRes.status === 200 && auditRes.data.success) {
      pass('GET /api/audit-logs', `Retrieved ${(auditRes.data.data || []).length} audit log entries`);
    } else {
      fail('GET /api/audit-logs', `Status ${auditRes.status}`);
    }
  } catch (e) {
    fail('Audit logs check', e.message);
  }

  // --- 7. ASK PEOPLEPAY AI ---
  console.log('\n7. Testing Ask PeoplePay AI Endpoint...');
  try {
    const aiRes = await request('POST', '/api/ai/query', { query: 'What is the average employee salary across all active contracts?' }, adminToken);
    if (aiRes.status === 200 && aiRes.data.success && aiRes.data.data?.answer) {
      pass('POST /api/ai/query', `Answer generated (${aiRes.data.data.answer.slice(0, 75).replace(/\n/g, ' ')}...)`);
    } else {
      fail('POST /api/ai/query', `Status ${aiRes.status}: ${JSON.stringify(aiRes.data)}`);
    }
  } catch (e) {
    fail('POST /api/ai/query', e.message);
  }

  // --- 8. DATABASE INTEGRITY & ORPHAN CHECKS ---
  console.log('\n8. Testing Database Relational Integrity...');
  try {
    // 1. Orphan contracts
    const [orphanContracts] = await query(`
      SELECT COUNT(*) as count FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE e.id IS NULL
    `);
    if (orphanContracts.count === 0) {
      pass('DB: No orphan contracts');
    } else {
      fail('DB: Orphan contracts found', `${orphanContracts.count} contracts have invalid employee_id`);
    }

    // 2. Orphan attendances
    const [orphanAttendances] = await query(`
      SELECT COUNT(*) as count FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE e.id IS NULL
    `);
    if (orphanAttendances.count === 0) {
      pass('DB: No orphan attendances');
    } else {
      fail('DB: Orphan attendances found', `${orphanAttendances.count} attendances have invalid employee_id`);
    }

    // 3. Orphan payslips
    const [orphanPayslips] = await query(`
      SELECT COUNT(*) as count FROM payslips p
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE e.id IS NULL
    `);
    if (orphanPayslips.count === 0) {
      pass('DB: No orphan payslips');
    } else {
      fail('DB: Orphan payslips found', `${orphanPayslips.count} payslips have invalid employee_id`);
    }

    // 4. Orphan payslip lines
    const [orphanLines] = await query(`
      SELECT COUNT(*) as count FROM payslip_lines pl
      LEFT JOIN payslips p ON pl.payslip_id = p.id
      WHERE p.id IS NULL
    `);
    if (orphanLines.count === 0) {
      pass('DB: No orphan payslip lines');
    } else {
      fail('DB: Orphan payslip lines found', `${orphanLines.count} lines have invalid payslip_id`);
    }

    // 5. Overlapping active contracts for same employee
    const overlappingContracts = await query(`
      SELECT c1.employee_id, COUNT(*) as count
      FROM contracts c1
      JOIN contracts c2 ON c1.employee_id = c2.employee_id AND c1.id != c2.id
      WHERE c1.status = 'Running' AND c2.status = 'Running'
        AND (c1.end_date IS NULL OR c1.end_date >= c2.start_date)
        AND (c2.end_date IS NULL OR c2.end_date >= c1.start_date)
      GROUP BY c1.employee_id
    `);
    if (overlappingContracts.length === 0) {
      pass('DB: No overlapping active contracts for same employee');
    } else {
      fail('DB: Overlapping active contracts', `${overlappingContracts.length} employees have overlapping active contracts`);
    }

    // 6. Gross - Deductions = Net check
    const netMismatches = await query(`
      SELECT id, gross_salary, total_deductions, net_salary,
             ROUND(gross_salary - total_deductions, 2) as expected_net,
             ROUND(ABS(net_salary - (gross_salary - total_deductions)), 2) as diff
      FROM payslips
      WHERE ROUND(ABS(net_salary - (gross_salary - total_deductions)), 2) > 0.05
    `);
    if (netMismatches.length === 0) {
      pass('DB: Payslip Net Wages mathematically match Gross - Deductions');
    } else {
      warn('DB: Payslip Net Wage discrepancies', `${netMismatches.length} payslips have gross - deductions != net`);
    }

    // 7. Table row counts summary
    const counts = {};
    const tables = ['users', 'employees', 'departments', 'job_positions', 'contracts', 'working_schedules', 'attendance', 'time_off_requests', 'payruns', 'payslips', 'payslip_lines', 'audit_logs', 'notifications'];
    for (const t of tables) {
      try {
        const [r] = await query(`SELECT COUNT(*) as count FROM ${t}`);
        counts[t] = r.count;
      } catch (e) {
        counts[t] = 'N/A';
      }
    }
    console.log('\n📊 Database Row Counts:');
    console.table(counts);

  } catch (e) {
    fail('Database relational integrity checks', e.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 AUDIT COMPLETED: ${results.passed.length} Passed, ${results.failed.length} Failed, ${results.warnings.length} Warnings`);
  console.log('====================================================');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
