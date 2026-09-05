const bcrypt = require('bcryptjs');
const { getPool, initDatabase } = require('../config/db');

async function seed() {
  console.log('[Seed] Starting database seeding for PeoplePay360...');
  const pool = await initDatabase();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Roles
    console.log('[Seed] Seeding roles...');
    const roles = [
      ['Admin', 'Full administrative access to all modules and configurations'],
      ['HR Payroll Admin', 'Full payroll management, salary structures, rules, payrun approval & payment'],
      ['HR Payroll User', 'Operational payroll processing, payslip computation, validation'],
      ['HR Manager', 'Employee directory, contracts, schedules, attendance, time-off approvals'],
      ['Employee', 'Self-service portal: profile, punch attendance, time-off requests, view/download payslips']
    ];
    for (const [name, desc] of roles) {
      await conn.query(`INSERT INTO roles (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description);`, [name, desc]);
    }

    // 2. Departments
    console.log('[Seed] Seeding departments...');
    const departments = [
      ['Engineering', 'ENG', 'Core software engineering and architecture'],
      ['Human Resources', 'HR', 'People operations, talent, and compliance'],
      ['Finance & Payroll', 'FIN', 'Corporate finance, payroll accounting, and audits'],
      ['Operations & Logistics', 'OPS', 'Business operations, facilities, and administration'],
      ['Sales & Growth', 'SALES', 'Business development and client partnerships']
    ];
    for (const [name, code, desc] of departments) {
      await conn.query(`INSERT INTO departments (name, code, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description);`, [name, code, desc]);
    }

    // 3. Job Positions
    console.log('[Seed] Seeding job positions...');
    const [deptRows] = await conn.query('SELECT id, code FROM departments');
    const deptMap = {};
    deptRows.forEach(d => { deptMap[d.code] = d.id; });

    const jobPositions = [
      ['Principal Architect', deptMap['ENG'], 'L6'],
      ['Senior Full-Stack Engineer', deptMap['ENG'], 'L4'],
      ['Frontend Engineer', deptMap['ENG'], 'L3'],
      ['HR Director', deptMap['HR'], 'L6'],
      ['HR Operations Specialist', deptMap['HR'], 'L3'],
      ['Compensation & Benefits Lead', deptMap['FIN'], 'L5'],
      ['Payroll Specialist', deptMap['FIN'], 'L3'],
      ['Operations Lead', deptMap['OPS'], 'L4'],
      ['Account Executive', deptMap['SALES'], 'L3']
    ];
    for (const [title, deptId, grade] of jobPositions) {
      const [existing] = await conn.query('SELECT id FROM job_positions WHERE title=? AND department_id=?', [title, deptId]);
      if (existing.length === 0) {
        await conn.query('INSERT INTO job_positions (title, department_id, grade) VALUES (?, ?, ?)', [title, deptId, grade]);
      }
    }

    // 4. Working Schedules
    console.log('[Seed] Seeding working schedules...');
    const schedules = [
      ['Standard 40-Hour (Mon-Fri)', 5, 40.00, 'PeoplePay360 Global', 'Asia/Kolkata'],
      ['Flexible Tech (Mon-Fri)', 5, 40.00, 'PeoplePay360 Global', 'Asia/Kolkata'],
      ['Shift Operations (6 Days)', 6, 42.00, 'PeoplePay360 Global', 'Asia/Kolkata']
    ];
    for (const [name, days, hours, comp, tz] of schedules) {
      const [existing] = await conn.query('SELECT id FROM working_schedules WHERE name=?', [name]);
      let schedId;
      if (existing.length === 0) {
        const [res] = await conn.query('INSERT INTO working_schedules (name, days_per_week, hours_per_week, company, timezone) VALUES (?, ?, ?, ?, ?)', [name, days, hours, comp, tz]);
        schedId = res.insertId;
      } else {
        schedId = existing[0].id;
      }

      // Populate schedule_days if empty
      const [dayCheck] = await conn.query('SELECT id FROM schedule_days WHERE schedule_id=?', [schedId]);
      if (dayCheck.length === 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let d = 1; d <= (days === 6 ? 6 : 5); d++) {
          await conn.query('INSERT INTO schedule_days (schedule_id, day_of_week, day_name, start_time, end_time, break_hours, work_hours) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [schedId, d, dayNames[d], '09:00:00', days === 6 ? '17:00:00' : '18:00:00', 1.00, days === 6 ? 7.00 : 8.00]);
        }
      }
    }

    // 5. Time Off Types
    console.log('[Seed] Seeding time off types...');
    const timeOffTypes = [
      ['Paid Time Off', 'PTO', 'days', true, '#10b981'],
      ['Sick Leave', 'SL', 'days', true, '#f59e0b'],
      ['Compensatory Off', 'COMP', 'days', true, '#8b5cf6'],
      ['Leave Without Pay', 'LOP', 'days', false, '#ef4444']
    ];
    for (const [name, code, unit, reqAlloc, color] of timeOffTypes) {
      await conn.query(`INSERT INTO time_off_types (name, code, unit, requires_allocation, color) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), color=VALUES(color);`,
        [name, code, unit, reqAlloc, color]);
    }

    // 6. Salary Structures & Rules
    console.log('[Seed] Seeding salary rules and structures...');
    const salaryRules = [
      { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, calculation_type: 'PRORATED_DAYS', percentage: 100.00, component_code: null, fixed_amount: 0, formula_expression: 'WAGE * (WORKED_DAYS / TOTAL_DAYS)' },
      { name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'ALLOWANCE', sequence: 20, calculation_type: 'PERCENT_COMPONENT', percentage: 40.00, component_code: 'BASIC', fixed_amount: 0, formula_expression: null },
      { name: 'Conveyance Allowance', code: 'CONV', category: 'ALLOWANCE', sequence: 30, calculation_type: 'FIXED', percentage: 0, component_code: null, fixed_amount: 3000.00, formula_expression: null },
      { name: 'Special Allowance', code: 'SPECIAL', category: 'ALLOWANCE', sequence: 40, calculation_type: 'PERCENT_COMPONENT', percentage: 15.00, component_code: 'BASIC', fixed_amount: 0, formula_expression: null },
      { name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 50, calculation_type: 'FORMULA', percentage: 0, component_code: null, fixed_amount: 0, formula_expression: 'BASIC + HRA + CONV + SPECIAL' },
      { name: 'Provident Fund (PF)', code: 'PF', category: 'DEDUCTION', sequence: 60, calculation_type: 'PERCENT_COMPONENT', percentage: 12.00, component_code: 'BASIC', fixed_amount: 0, formula_expression: null },
      { name: 'Professional Tax', code: 'PTAX', category: 'DEDUCTION', sequence: 70, calculation_type: 'FIXED', percentage: 0, component_code: null, fixed_amount: 200.00, formula_expression: null },
      { name: 'Tax Deducted at Source (TDS)', code: 'TDS', category: 'DEDUCTION', sequence: 80, calculation_type: 'FORMULA', percentage: 0, component_code: null, fixed_amount: 0, formula_expression: 'GROSS * 0.05' },
      { name: 'Net Salary', code: 'NET', category: 'NET', sequence: 90, calculation_type: 'FORMULA', percentage: 0, component_code: null, fixed_amount: 0, formula_expression: 'GROSS - PF - PTAX - TDS' }
    ];

    for (const r of salaryRules) {
      await conn.query(`
        INSERT INTO salary_rules (name, code, category, sequence, calculation_type, percentage, component_code, fixed_amount, formula_expression, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), sequence=VALUES(sequence), calculation_type=VALUES(calculation_type), percentage=VALUES(percentage), component_code=VALUES(component_code), fixed_amount=VALUES(fixed_amount), formula_expression=VALUES(formula_expression);
      `, [r.name, r.code, r.category, r.sequence, r.calculation_type, r.percentage, r.component_code, r.fixed_amount, r.formula_expression]);
    }

    // Salary Structure: Standard Structure
    let [structRes] = await conn.query(`SELECT id FROM salary_structures WHERE code='STD_STRUCTURE'`);
    let structId;
    if (structRes.length === 0) {
      const [insertStruct] = await conn.query(`
        INSERT INTO salary_structures (name, code, description, is_active)
        VALUES ('Standard Corporate Structure', 'STD_STRUCTURE', 'Default standard corporate salary breakdown with Basic, HRA, Conveyance, Special, PF, PTAX, TDS', true)
      `);
      structId = insertStruct.insertId;
    } else {
      structId = structRes[0].id;
    }

    // Link rules to structure
    const [allRules] = await conn.query('SELECT id, sequence FROM salary_rules');
    for (const r of allRules) {
      await conn.query(`
        INSERT INTO salary_structure_rules (structure_id, rule_id, sequence_override)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE sequence_override=VALUES(sequence_override);
      `, [structId, r.id, r.sequence]);
    }

    // 7. Employees & Users
    console.log('[Seed] Seeding employees & users...');
    const [schedRows] = await conn.query('SELECT id FROM working_schedules LIMIT 1');
    const defaultSchedId = schedRows[0].id;
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    const [posRows] = await conn.query('SELECT id, title, department_id FROM job_positions');
    const posMap = {};
    posRows.forEach(p => { posMap[p.title] = p; });

    const employeesSeed = [
      {
        emp_code: 'EMP001',
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul.sharma@peoplepay360.com',
        phone: '+91 98765 43210',
        gender: 'Male',
        date_of_birth: '1994-06-15',
        joining_date: '2025-01-10',
        department_id: deptMap['ENG'],
        job_position_id: posMap['Senior Full-Stack Engineer']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'HDFC Bank',
        bank_account_no: '50100234567890',
        bank_ifsc: 'HDFC0001234',
        pan_number: 'ABCPS1234F',
        role: 'Employee'
      },
      {
        emp_code: 'EMP002',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'hr.manager@peoplepay360.com',
        phone: '+91 98765 43211',
        gender: 'Female',
        date_of_birth: '1992-04-20',
        joining_date: '2024-03-01',
        department_id: deptMap['HR'],
        job_position_id: posMap['HR Operations Specialist']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'ICICI Bank',
        bank_account_no: '001105009988',
        bank_ifsc: 'ICIC0000011',
        pan_number: 'BCTPP5678G',
        role: 'HR Manager'
      },
      {
        emp_code: 'EMP003',
        first_name: 'Vikram',
        last_name: 'Malhotra',
        email: 'payroll.admin@peoplepay360.com',
        phone: '+91 98765 43212',
        gender: 'Male',
        date_of_birth: '1988-11-12',
        joining_date: '2023-08-15',
        department_id: deptMap['FIN'],
        job_position_id: posMap['Compensation & Benefits Lead']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'State Bank of India',
        bank_account_no: '30998877665',
        bank_ifsc: 'SBIN0004567',
        pan_number: 'CKLPM9012H',
        role: 'HR Payroll Admin'
      },
      {
        emp_code: 'EMP004',
        first_name: 'Ananya',
        last_name: 'Sen',
        email: 'payroll.user@peoplepay360.com',
        phone: '+91 98765 43213',
        gender: 'Female',
        date_of_birth: '1996-09-08',
        joining_date: '2025-02-01',
        department_id: deptMap['FIN'],
        job_position_id: posMap['Payroll Specialist']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'Axis Bank',
        bank_account_no: '918020034455667',
        bank_ifsc: 'UTIB0000890',
        pan_number: 'DKLPS3456K',
        role: 'HR Payroll User'
      },
      {
        emp_code: 'EMP005',
        first_name: 'Arjun',
        last_name: 'Mehta',
        email: 'admin@peoplepay360.com',
        phone: '+91 98765 43214',
        gender: 'Male',
        date_of_birth: '1985-02-28',
        joining_date: '2022-01-01',
        department_id: deptMap['ENG'],
        job_position_id: posMap['Principal Architect']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'Kotak Mahindra Bank',
        bank_account_no: '2233445566',
        bank_ifsc: 'KKBK0000123',
        pan_number: 'EKMPM7890L',
        role: 'Admin'
      },
      {
        emp_code: 'EMP006',
        first_name: 'Sneha',
        last_name: 'Reddy',
        email: 'sneha.reddy@peoplepay360.com',
        phone: '+91 98765 43215',
        gender: 'Female',
        date_of_birth: '1995-12-05',
        joining_date: '2025-04-01',
        department_id: deptMap['ENG'],
        job_position_id: posMap['Frontend Engineer']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: null, // INTENTIONAL: triggers missing bank info warning
        bank_account_no: null,
        bank_ifsc: null,
        pan_number: 'FKRPR4321M',
        role: 'Employee'
      },
      {
        emp_code: 'EMP007',
        first_name: 'Karan',
        last_name: 'Joshi',
        email: 'karan.joshi@peoplepay360.com',
        phone: '+91 98765 43216',
        gender: 'Male',
        date_of_birth: '1993-08-22',
        joining_date: '2024-06-15',
        department_id: deptMap['OPS'],
        job_position_id: posMap['Operations Lead']?.id,
        employment_status: 'active',
        working_schedule_id: defaultSchedId,
        bank_name: 'HDFC Bank',
        bank_account_no: '50100998877665',
        bank_ifsc: 'HDFC0001234',
        pan_number: 'GKJPJ8765N',
        role: 'Employee'
      }
    ];

    const empIdMap = {};

    for (const emp of employeesSeed) {
      let [existingEmp] = await conn.query('SELECT id FROM employees WHERE email=?', [emp.email]);
      let empId;
      if (existingEmp.length === 0) {
        const [insertRes] = await conn.query(`
          INSERT INTO employees (emp_code, first_name, last_name, email, phone, gender, date_of_birth, joining_date, department_id, job_position_id, employment_status, working_schedule_id, bank_name, bank_account_no, bank_ifsc, pan_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [emp.emp_code, emp.first_name, emp.last_name, emp.email, emp.phone, emp.gender, emp.date_of_birth, emp.joining_date, emp.department_id, emp.job_position_id, emp.employment_status, emp.working_schedule_id, emp.bank_name, emp.bank_account_no, emp.bank_ifsc, emp.pan_number]);
        empId = insertRes.insertId;
      } else {
        empId = existingEmp[0].id;
      }
      empIdMap[emp.emp_code] = empId;

      // Seed / update user account
      await conn.query(`
        INSERT INTO users (employee_id, work_email, password_hash, role, account_status)
        VALUES (?, ?, ?, ?, 'Active')
        ON DUPLICATE KEY UPDATE role=VALUES(role), password_hash=VALUES(password_hash), account_status='Active';
      `, [empId, emp.email, defaultPasswordHash, emp.role]);
    }

    // 8. Contracts (Demonstrating Historical & Current Contracts!)
    console.log('[Seed] Seeding historical and current contracts...');
    // Rahul Sharma: Contract A (Jan to Jun 2026, wage: 35,000, expired), Contract B (Jul 2026 onwards, wage: 55,000, running)
    const contractsSeed = [
      {
        code: 'CNT-2026-001A',
        emp_code: 'EMP001',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        wage: 35000.00,
        status: 'expired',
        notes: 'Initial probationary contract'
      },
      {
        code: 'CNT-2026-001B',
        emp_code: 'EMP001',
        start_date: '2026-07-01',
        end_date: null,
        wage: 55000.00,
        status: 'running',
        notes: 'Post-probation confirmed appraisal contract'
      },
      {
        code: 'CNT-2026-002',
        emp_code: 'EMP002',
        start_date: '2024-03-01',
        end_date: null,
        wage: 65000.00,
        status: 'running',
        notes: 'HR Lead Employment Contract'
      },
      {
        code: 'CNT-2026-003',
        emp_code: 'EMP003',
        start_date: '2023-08-15',
        end_date: null,
        wage: 75000.00,
        status: 'running',
        notes: 'Payroll Admin Contract'
      },
      {
        code: 'CNT-2026-004',
        emp_code: 'EMP004',
        start_date: '2025-02-01',
        end_date: null,
        wage: 48000.00,
        status: 'running',
        notes: 'Payroll Specialist Contract'
      },
      {
        code: 'CNT-2026-005',
        emp_code: 'EMP005',
        start_date: '2022-01-01',
        end_date: null,
        wage: 120000.00,
        status: 'running',
        notes: 'Executive Architect Contract'
      },
      {
        code: 'CNT-2026-006',
        emp_code: 'EMP006',
        start_date: '2025-04-01',
        end_date: null,
        wage: 60000.00,
        status: 'running',
        notes: 'Frontend Engineer Contract'
      },
      {
        code: 'CNT-2026-007',
        emp_code: 'EMP007',
        start_date: '2024-06-15',
        end_date: null,
        wage: 45000.00,
        status: 'running',
        notes: 'Operations Specialist Contract'
      }
    ];

    for (const cnt of contractsSeed) {
      const empId = empIdMap[cnt.emp_code];
      const [existingCnt] = await conn.query('SELECT id FROM contracts WHERE contract_code=?', [cnt.code]);
      if (existingCnt.length === 0) {
        await conn.query(`
          INSERT INTO contracts (contract_code, employee_id, start_date, end_date, wage, working_schedule_id, salary_structure_id, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [cnt.code, empId, cnt.start_date, cnt.end_date, cnt.wage, defaultSchedId, structId, cnt.status, cnt.notes]);
      }
    }

    // 9. Time Off Allocations & Sample Requests
    console.log('[Seed] Seeding time off allocations and requests...');
    const [types] = await conn.query('SELECT id, code FROM time_off_types');
    const typeMap = {};
    types.forEach(t => { typeMap[t.code] = t.id; });

    for (const empCode of Object.keys(empIdMap)) {
      const empId = empIdMap[empCode];
      // Allocate PTO: 18 days, SL: 10 days, COMP: 3 days for 2026
      await conn.query(`
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, used_days, remaining_days)
        VALUES (?, ?, 2026, 18.00, 2.00, 16.00)
        ON DUPLICATE KEY UPDATE allocated_days=18.00;
      `, [empId, typeMap['PTO']]);

      await conn.query(`
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, used_days, remaining_days)
        VALUES (?, ?, 2026, 10.00, 1.00, 9.00)
        ON DUPLICATE KEY UPDATE allocated_days=10.00;
      `, [empId, typeMap['SL']]);
    }

    // Sample Approved Request for Rahul Sharma in July 2026
    const rahulId = empIdMap['EMP001'];
    const hrManagerId = empIdMap['EMP002'];
    const [existingReq] = await conn.query('SELECT id FROM time_off_requests WHERE employee_id=? AND start_date=?', [rahulId, '2026-07-15']);
    if (existingReq.length === 0) {
      await conn.query(`
        INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, requested_amount, unit, reason, status, approver_id, approval_notes, approved_at)
        VALUES (?, ?, '2026-07-15', '2026-07-16', 2.00, 'days', 'Family occasion', 'approved', ?, 'Approved as requested', '2026-07-10 10:30:00')
      `, [rahulId, typeMap['PTO'], hrManagerId]);
    }

    // Sample Pending Request for Priya Patel
    const [pendingReq] = await conn.query('SELECT id FROM time_off_requests WHERE employee_id=? AND status="pending"', [hrManagerId]);
    if (pendingReq.length === 0) {
      await conn.query(`
        INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, requested_amount, unit, reason, status)
        VALUES (?, ?, '2026-09-10', '2026-09-11', 2.00, 'days', 'Medical checkup and rest', 'pending')
      `, [hrManagerId, typeMap['SL']]);
    }

    // 10. Attendance Records for August 2026
    console.log('[Seed] Seeding attendance records for August 2026...');
    // Seed 22 working days for each employee
    for (let day = 1; day <= 22; day++) {
      const dateStr = `2026-08-${day.toString().padStart(2, '0')}`;
      const dayOfWeek = new Date(`2026-08-${day}`).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      for (const empCode of Object.keys(empIdMap)) {
        const empId = empIdMap[empCode];
        // Karan Joshi (EMP007) has unapproved absences on Aug 18 & 19
        if (empCode === 'EMP007' && (day === 18 || day === 19)) {
          await conn.query(`
            INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, break_hours, status, notes)
            VALUES (?, ?, ?, ?, 0.00, 0.00, 'absent', 'Unapproved absence / no punch')
            ON DUPLICATE KEY UPDATE status='absent';
          `, [empId, dateStr, `${dateStr} 00:00:00`, `${dateStr} 00:00:00`]);
          continue;
        }

        const checkIn = `${dateStr} 09:02:15`;
        const checkOut = `${dateStr} 18:05:40`;
        await conn.query(`
          INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, break_hours, status)
          VALUES (?, ?, ?, ?, 8.00, 1.00, 'present')
          ON DUPLICATE KEY UPDATE worked_hours=8.00, status='present';
        `, [empId, dateStr, checkIn, checkOut]);
      }
    }

    // 11. Historical Payrun for July 2026 (Finalized & Paid)
    console.log('[Seed] Seeding July 2026 historical payrun and payslips...');
    const [existingJulyPayrun] = await conn.query(`SELECT id FROM payruns WHERE period_month='2026-07'`);
    if (existingJulyPayrun.length === 0) {
      const [julRun] = await conn.query(`
        INSERT INTO payruns (payrun_code, name, period_month, start_date, end_date, salary_structure_id, status, total_gross, total_deductions, total_net, employee_count, paid_at)
        VALUES ('PR-2026-07', 'Regular Payroll - July 2026', '2026-07', '2026-07-01', '2026-07-31', ?, 'paid', 525000.00, 68400.00, 456600.00, 7, '2026-08-01 15:00:00')
      `, [structId]);
      const julPayrunId = julRun.insertId;

      // Seed July payslips for all employees
      for (const empCode of Object.keys(empIdMap)) {
        const empId = empIdMap[empCode];
        const [activeCnt] = await conn.query(`
          SELECT id, wage FROM contracts WHERE employee_id=? AND start_date <= '2026-07-31' AND (end_date IS NULL OR end_date >= '2026-07-01') ORDER BY start_date DESC LIMIT 1
        `, [empId]);
        if (activeCnt.length > 0) {
          const wage = Number(activeCnt[0].wage);
          const basic = wage;
          const hra = basic * 0.40;
          const conv = 3000;
          const special = basic * 0.15;
          const gross = basic + hra + conv + special;
          const pf = basic * 0.12;
          const ptax = 200;
          const tds = gross * 0.05;
          const totalDed = pf + ptax + tds;
          const net = gross - totalDed;

          const payslipCode = `PS-2026-07-${empCode}`;
          const [psRes] = await conn.query(`
            INSERT INTO payslips (payslip_code, payrun_id, employee_id, contract_id, salary_structure_id, period_month, start_date, end_date, worked_days, total_days, gross_salary, total_deductions, net_salary, status, email_sent)
            VALUES (?, ?, ?, ?, ?, '2026-07', '2026-07-01', '2026-07-31', 30.00, 30.00, ?, ?, ?, 'paid', true)
          `, [payslipCode, julPayrunId, empId, activeCnt[0].id, structId, gross, totalDed, net]);
          const psId = psRes.insertId;

          // Lines
          const lines = [
            ['BASIC', 'Basic Salary', 'BASIC', 10, basic, 100, wage],
            ['HRA', 'House Rent Allowance', 'ALLOWANCE', 20, hra, 40, basic],
            ['CONV', 'Conveyance Allowance', 'ALLOWANCE', 30, conv, 0, 0],
            ['SPECIAL', 'Special Allowance', 'ALLOWANCE', 40, special, 15, basic],
            ['GROSS', 'Gross Salary', 'GROSS', 50, gross, 0, 0],
            ['PF', 'Provident Fund', 'DEDUCTION', 60, pf, 12, basic],
            ['PTAX', 'Professional Tax', 'DEDUCTION', 70, ptax, 0, 0],
            ['TDS', 'TDS', 'DEDUCTION', 80, tds, 5, gross],
            ['NET', 'Net Salary', 'NET', 90, net, 0, 0]
          ];
          for (const [code, name, cat, seq, amt, rate, base] of lines) {
            await conn.query(`
              INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, sequence, amount, rate, base_amount)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [psId, code, name, cat, seq, amt, rate, base]);
          }
        }
      }
    }

    // 12. Notifications
    console.log('[Seed] Seeding sample notifications...');
    const [adminUser] = await conn.query(`SELECT id FROM users WHERE role='Admin' LIMIT 1`);
    if (adminUser.length > 0) {
      await conn.query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Welcome to PeoplePay360', 'Your system is primed and ready with initial sample organization data.', 'success', '/dashboard');
      `, [adminUser[0].id]);
    }

    await conn.commit();
    console.log('[Seed] Database seeding completed successfully! 🎉');
  } catch (error) {
    await conn.rollback();
    console.error('[Seed] Database seeding failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seed;
