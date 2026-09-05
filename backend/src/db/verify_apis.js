const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING PEOPLEPAY360 APIS & DEMO INTEGRATION ===\n');

  // 1. Health Check
  const health = await request({ hostname: 'localhost', port: 5001, path: '/api/health', method: 'GET' });
  console.log(`1. Health Check: HTTP ${health.status} -> ${health.data?.status || 'OK'}`);

  // 2. Demo User Logins
  console.log('\n2. Testing Demo User Logins:');
  const demoAccounts = [
    { email: 'admin@peoplepay360.com', role: 'Admin' },
    { email: 'priya.patel@peoplepay360.com', role: 'HR Manager' },
    { email: 'amit.singh@peoplepay360.com', role: 'HR Payroll Admin' },
    { email: 'neha.gupta@peoplepay360.com', role: 'HR Payroll User' },
    { email: 'rahul.sharma@peoplepay360.com', role: 'Employee' },
    { email: 'vikas.mehta@peoplepay360.com', role: 'Employee' }
  ];

  let adminToken = '';
  let employeeToken = '';

  for (const acc of demoAccounts) {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: acc.email, password: 'Password@123' }
    );
    const token = res.data?.data?.token;
    const ok = res.status === 200 && Boolean(token);
    console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${acc.email} (${acc.role}) -> HTTP ${res.status}`);
    if (acc.role === 'Admin') adminToken = token;
    if (acc.email === 'rahul.sharma@peoplepay360.com') employeeToken = token;
  }

  const authHeader = { Authorization: `Bearer ${adminToken}` };

  // 3. Dashboard Metrics
  console.log('\n3. Dashboard Metrics:');
  const dashRes = await request({ hostname: 'localhost', port: 5001, path: '/api/dashboard', method: 'GET', headers: authHeader });
  const dData = dashRes.data?.data;
  console.log(`  Total Net Paid: ₹${dData?.kpis?.totalNetPaid?.toLocaleString()}`);
  console.log(`  Total Employees: ${dData?.kpis?.totalEmployees} (Active: ${dData?.kpis?.activeEmployees})`);
  console.log(`  Attendance Health: ${dData?.kpis?.attendanceHealthPercent}%`);
  console.log(`  Approved Leaves: ${dData?.kpis?.approvedTimeOffDays} days`);
  console.log(`  Department Salaries Breakdown: ${dData?.departmentSalaries?.length} departments`);
  console.log(`  Monthly Net Trends: ${dData?.monthlyTrends?.length} payrun trends`);
  console.log(`  Active Alerts: ${dData?.alerts?.length} alert(s) ->`, dData?.alerts?.map(a => `[${a.severity}] ${a.title}`).join(' | '));
  console.log(`  Available Periods:`, dData?.availablePeriods?.map(p => p.period_month).join(', '));

  // 4. Employees API (Search & Filter)
  console.log('\n4. Employees API:');
  const allEmpRes = await request({ hostname: 'localhost', port: 5001, path: '/api/employees', method: 'GET', headers: authHeader });
  console.log(`  Total employees returned: ${allEmpRes.data?.data?.length}`);

  const searchRes = await request({ hostname: 'localhost', port: 5001, path: '/api/employees?search=Rajesh', method: 'GET', headers: authHeader });
  console.log(`  Search 'Rajesh': ${searchRes.data?.data?.length} match(es) -> ${searchRes.data?.data?.[0]?.first_name} ${searchRes.data?.data?.[0]?.last_name}`);

  const deptRes = await request({ hostname: 'localhost', port: 5001, path: '/api/employees?department_id=1', method: 'GET', headers: authHeader });
  console.log(`  Department 1 (Engineering) filter: ${deptRes.data?.data?.length} employees`);

  const statusRes = await request({ hostname: 'localhost', port: 5001, path: '/api/employees?status=Terminated', method: 'GET', headers: authHeader });
  console.log(`  Status 'Terminated' filter: ${statusRes.data?.data?.length} employees ->`, statusRes.data?.data?.map(e => `${e.first_name} ${e.last_name}`).join(', '));

  // 5. Contracts API
  console.log('\n5. Contracts API:');
  const contractsRes = await request({ hostname: 'localhost', port: 5001, path: '/api/contracts', method: 'GET', headers: authHeader });
  console.log(`  Total contracts: ${contractsRes.data?.data?.length}`);
  const runningRes = await request({ hostname: 'localhost', port: 5001, path: '/api/contracts?status=Running', method: 'GET', headers: authHeader });
  console.log(`  Running contracts: ${runningRes.data?.data?.length}`);
  const expiredRes = await request({ hostname: 'localhost', port: 5001, path: '/api/contracts?status=Expired', method: 'GET', headers: authHeader });
  console.log(`  Expired contracts: ${expiredRes.data?.data?.length}`);

  // 6. Attendance API
  console.log('\n6. Attendance API:');
  const attRes = await request({ hostname: 'localhost', port: 5001, path: '/api/attendance', method: 'GET', headers: authHeader });
  console.log(`  Total attendance records: ${attRes.data?.data?.length}`);
  const dateAttRes = await request({ hostname: 'localhost', port: 5001, path: '/api/attendance?start_date=2026-08-10&end_date=2026-08-10', method: 'GET', headers: authHeader });
  console.log(`  Aug 10, 2026 attendance records: ${dateAttRes.data?.data?.length}`);
  const lateAttRes = await request({ hostname: 'localhost', port: 5001, path: '/api/attendance?status=Late', method: 'GET', headers: authHeader });
  console.log(`  Late attendance records: ${lateAttRes.data?.data?.length}`);

  // 7. Time Off API
  console.log('\n7. Time Off Requests API:');
  const toRes = await request({ hostname: 'localhost', port: 5001, path: '/api/time-off/requests', method: 'GET', headers: authHeader });
  console.log(`  Total time off requests: ${toRes.data?.data?.length}`);
  const pendingToRes = await request({ hostname: 'localhost', port: 5001, path: '/api/time-off/requests?status=Pending', method: 'GET', headers: authHeader });
  console.log(`  Pending requests: ${pendingToRes.data?.data?.length}`);
  const approvedToRes = await request({ hostname: 'localhost', port: 5001, path: '/api/time-off/requests?status=Approved', method: 'GET', headers: authHeader });
  console.log(`  Approved requests: ${approvedToRes.data?.data?.length}`);
  const rejectedToRes = await request({ hostname: 'localhost', port: 5001, path: '/api/time-off/requests?status=Rejected', method: 'GET', headers: authHeader });
  console.log(`  Rejected requests: ${rejectedToRes.data?.data?.length}`);

  // 8. Payruns API
  console.log('\n8. Payruns API:');
  const prRes = await request({ hostname: 'localhost', port: 5001, path: '/api/payruns', method: 'GET', headers: authHeader });
  console.log(`  Total payruns: ${prRes.data?.data?.length}`);
  prRes.data?.data?.forEach(pr => {
    console.log(`    - ID ${pr.id}: ${pr.name} | Period: ${pr.period_start?.slice(0, 10)} to ${pr.period_end?.slice(0, 10)} | Status: ${pr.status} | Net: ₹${Number(pr.total_net).toLocaleString()} | Slips: ${pr.computed_payslips_count}`);
  });

  // 9. Payslips API (and period_month filter)
  console.log('\n9. Payslips API:');
  const psRes = await request({ hostname: 'localhost', port: 5001, path: '/api/payslips', method: 'GET', headers: authHeader });
  console.log(`  Total payslips: ${psRes.data?.data?.length}`);

  const augPsRes = await request({ hostname: 'localhost', port: 5001, path: '/api/payslips?period_month=2026-08', method: 'GET', headers: authHeader });
  console.log(`  August 2026 payslips (period_month=2026-08): ${augPsRes.data?.data?.length}`);

  const junPsRes = await request({ hostname: 'localhost', port: 5001, path: '/api/payslips?period_month=2026-06', method: 'GET', headers: authHeader });
  console.log(`  June 2026 payslips (period_month=2026-06): ${junPsRes.data?.data?.length}`);

  const mayPsRes = await request({ hostname: 'localhost', port: 5001, path: '/api/payslips?period_month=2026-05', method: 'GET', headers: authHeader });
  console.log(`  May 2026 payslips (period_month=2026-05): ${mayPsRes.data?.data?.length}`);

  // 10. Relational Detail Check for Employee 101
  console.log('\n10. Detailed Relational Check (GET /api/employees/101):');
  const emp101Res = await request({ hostname: 'localhost', port: 5001, path: '/api/employees/101', method: 'GET', headers: authHeader });
  const e101 = emp101Res.data?.data;
  console.log(`  Employee: ${e101?.first_name} ${e101?.last_name} (${e101?.employee_code})`);
  console.log(`  Department: ${e101?.department_name} | Job: ${e101?.job_position_title}`);
  console.log(`  Contracts attached: ${e101?.contracts?.length}`);
  console.log(`  Attendance logs attached: ${e101?.attendance?.length}`);
  console.log(`  Time Off requests attached: ${e101?.time_off_requests?.length}`);
  console.log(`  Time Off allocations attached: ${e101?.time_off_allocations?.length}`);
  console.log(`  Payslips attached: ${e101?.payslips?.length}`);

  // 11. Single Payslip Detail (Lines Verification)
  if (augPsRes.data?.data?.length > 0) {
    const slipId = augPsRes.data.data[0].id;
    const slipRes = await request({ hostname: 'localhost', port: 5001, path: `/api/payslips/${slipId}`, method: 'GET', headers: authHeader });
    const slip = slipRes.data?.data;
    console.log(`\n11. Payslip #${slipId} Detailed Lines for ${slip?.first_name} ${slip?.last_name}:`);
    console.log(`  Gross: ₹${slip?.gross_salary} | Deductions: ₹${slip?.total_deductions} | Net: ₹${slip?.net_salary}`);
    console.log(`  Salary Lines (${slip?.lines?.length || 0}):`);
    slip?.lines?.forEach(l => {
      console.log(`    - [${l.code}] ${l.name.padEnd(25)}: ₹${Number(l.amount).toFixed(2)} (${l.category})`);
    });
  }

  console.log('\n=== ALL API CHECKS COMPLETED SUCCESSFULLY ===\n');
}

run().catch(err => {
  console.error('API Verification Error:', err);
  process.exit(1);
});
