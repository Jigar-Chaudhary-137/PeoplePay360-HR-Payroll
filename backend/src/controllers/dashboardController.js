const { query } = require('../config/db');

<<<<<<< HEAD
// Aggregated live dashboard metrics and charts
async function getDashboardMetrics(req, res) {
  const { period_month, department_id } = req.query;

  // 1. Determine active period filter (default to latest payrun period)
  let activePeriod = period_month;
  if (!activePeriod) {
    const [latestPr] = await query('SELECT period_month FROM payruns ORDER BY period_month DESC LIMIT 1');
    activePeriod = latestPr[0]?.period_month || '2026-08';
  }

  // 2. Load KPIs for active period
  let kpiSql = `
    SELECT
      COUNT(p.id) as total_payslips,
      COALESCE(SUM(p.net_salary), 0) as total_net_paid,
      COALESCE(SUM(p.gross_salary), 0) as total_gross,
      COALESCE(SUM(p.total_deductions), 0) as total_deductions,
      COALESCE(AVG(p.net_salary), 0) as avg_net_salary
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.period_month = ?
  `;
  const kpiParams = [activePeriod];

  if (department_id) {
    kpiSql += ` AND e.department_id = ?`;
    kpiParams.push(department_id);
  }

  const [kpiRes] = await query(kpiSql, kpiParams);

  // Active employees count
  let empSql = `SELECT COUNT(*) as count FROM employees WHERE employment_status = 'active'`;
  const empParams = [];
  if (department_id) {
    empSql += ` AND department_id = ?`;
    empParams.push(department_id);
  }
  const [empRes] = await query(empSql, empParams);

  // Approved time off in this period
  const [timeOffRes] = await query(
    `SELECT COALESCE(SUM(requested_amount), 0) as approved_days
     FROM time_off_requests r
     JOIN employees e ON r.employee_id = e.id
     WHERE r.status = 'approved' AND DATE_FORMAT(r.start_date, '%Y-%m') = ?`,
    [activePeriod]
  );

  // Attendance Health Rate in this period
  const [attRes] = await query(
    `SELECT
       COUNT(*) as total_punches,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_punches
     FROM attendance a
     JOIN employees e ON a.employee_id = e.id
     WHERE DATE_FORMAT(a.date, '%Y-%m') = ?`,
    [activePeriod]
  );
  const totalPunches = attRes[0]?.total_punches || 0;
  const presentPunches = attRes[0]?.present_punches || 0;
  const attendanceHealth = totalPunches > 0 ? Math.round((presentPunches / totalPunches) * 100) : 95;

  // 3. Department Cost Breakdown Chart
  const deptCosts = await query(
    `SELECT d.name as department_name, d.code as department_code,
            COUNT(p.id) as employee_count,
            COALESCE(SUM(p.net_salary), 0) as total_net,
            COALESCE(SUM(p.gross_salary), 0) as total_gross,
            COALESCE(AVG(p.net_salary), 0) as avg_net
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     LEFT JOIN payslips p ON p.employee_id = e.id AND p.period_month = ?
     GROUP BY d.id, d.name, d.code
     ORDER BY total_net DESC`,
    [activePeriod]
  );

  // 4. Monthly Trend (Past 6 Months)
  const monthlyTrend = await query(
    `SELECT pr.period_month,
            COALESCE(SUM(p.net_salary), pr.total_net) as total_net,
            COALESCE(SUM(p.gross_salary), pr.total_gross) as total_gross,
            COUNT(p.id) as payslip_count
     FROM payruns pr
     LEFT JOIN payslips p ON p.payrun_id = pr.id
     GROUP BY pr.id, pr.period_month
     ORDER BY pr.period_month ASC
     LIMIT 6`
  );

  // 5. Payslip Status Breakdown
  const statusCounts = await query(
    `SELECT status, COUNT(*) as count
     FROM payslips
     WHERE period_month = ?
     GROUP BY status`,
    [activePeriod]
  );

  // 6. Recent Anomalies & Alerts
  const anomalies = await query(
    `SELECT a.*, e.first_name, e.last_name, e.emp_code, d.name as department_name
     FROM payroll_anomalies a
     JOIN employees e ON a.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     ORDER BY a.severity = 'critical' DESC, a.created_at DESC
     LIMIT 6`
  );

  // 7. List of available periods for filter dropdown
  const availablePeriods = await query(
    `SELECT DISTINCT period_month FROM payruns ORDER BY period_month DESC`
  );

  return res.json({
    success: true,
    activePeriod,
    kpis: {
      total_net_paid: Number(kpiRes?.total_net_paid || 0),
      total_gross: Number(kpiRes?.total_gross || 0),
      total_deductions: Number(kpiRes?.total_deductions || 0),
      avg_net_salary: Math.round(Number(kpiRes?.avg_net_salary || 0)),
      total_payslips: Number(kpiRes?.total_payslips || 0),
      active_employees: Number(empRes?.count || 0),
      approved_leave_days: Number(timeOffRes?.approved_days || 0),
      attendance_health: attendanceHealth
    },
    charts: {
      deptCosts,
      monthlyTrend,
      statusCounts
    },
    anomalies,
    availablePeriods: availablePeriods.map(p => p.period_month)
  });
=======
async function getDashboardMetrics(req, res, next) {
  try {
    const { department_id, start_date, end_date } = req.query;

    // 1. Total Net Salary Paid (from finalized/paid payslips)
    let salarySql = `
      SELECT IFNULL(SUM(ps.net_salary), 0) AS total_net_paid,
             IFNULL(SUM(ps.gross_salary), 0) AS total_gross_paid,
             IFNULL(SUM(ps.total_deductions), 0) AS total_deductions_paid,
             COUNT(ps.id) AS total_payslips_count,
             IFNULL(AVG(ps.net_salary), 0) AS average_net_salary
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      WHERE ps.status IN ('paid', 'confirmed', 'computed')
    `;
    const salaryParams = [];

    if (department_id) {
      salarySql += ' AND e.department_id = ?';
      salaryParams.push(department_id);
    }
    if (start_date && end_date) {
      salarySql += ' AND ps.period_start >= ? AND ps.period_end <= ?';
      salaryParams.push(start_date, end_date);
    }

    const [salaryStats] = await query(salarySql, salaryParams);

    // 2. Total Employees & Active Count
    let empSql = `
      SELECT COUNT(*) AS total_employees,
             SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) AS active_employees
      FROM employees WHERE 1=1
    `;
    const empParams = [];
    if (department_id) {
      empSql += ' AND department_id = ?';
      empParams.push(department_id);
    }
    const [empStats] = await query(empSql, empParams);

    // 3. Approved Time Off days in current year
    let leaveSql = `
      SELECT IFNULL(SUM(tor.days_requested), 0) AS total_approved_leave_days,
             COUNT(tor.id) AS approved_leave_requests_count
      FROM time_off_requests tor
      JOIN employees e ON tor.employee_id = e.id
      WHERE tor.status = 'Approved'
    `;
    const leaveParams = [];
    if (department_id) {
      leaveSql += ' AND e.department_id = ?';
      leaveParams.push(department_id);
    }
    const [leaveStats] = await query(leaveSql, leaveParams);

    // 4. Attendance Health % (Present days vs Total recorded attendance entries)
    let attSql = `
      SELECT COUNT(*) AS total_attendance_logs,
             SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
             SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
             SUM(CASE WHEN a.status = 'Half Day' THEN 1 ELSE 0 END) AS half_day_count,
             SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const attParams = [];
    if (department_id) {
      attSql += ' AND e.department_id = ?';
      attParams.push(department_id);
    }
    const [attStats] = await query(attSql, attParams);

    const totalLogs = Number(attStats.total_attendance_logs || 0);
    const presentLogs = Number(attStats.present_count || 0);
    const attendanceHealthPercent = totalLogs > 0 
      ? Math.round(((presentLogs + (Number(attStats.half_day_count || 0) * 0.5)) / totalLogs) * 100) 
      : 96;

    // 5. Salary Cost by Department
    const departmentSalaries = await query(
      `SELECT d.id, d.name AS department_name, d.code,
              IFNULL(SUM(ps.net_salary), 0) AS total_cost,
              COUNT(DISTINCT e.id) AS employee_count
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id
       LEFT JOIN payslips ps ON e.id = ps.employee_id AND ps.status IN ('paid', 'confirmed', 'computed')
       GROUP BY d.id, d.name, d.code
       ORDER BY total_cost DESC`
    );

    // 6. Monthly Net Salary Trend (Last 6 payruns)
    const monthlyTrends = await query(
      `SELECT pr.id, pr.name, pr.period_start, pr.period_end,
              pr.total_net, pr.total_gross, pr.total_deductions, pr.status
       FROM payruns pr
       ORDER BY pr.period_start ASC
       LIMIT 6`
    );

    // 7. Real-Time Payroll Alerts & Warnings
    const alerts = [];

    // Check missing bank info
    const [missingBankCount] = await query(
      `SELECT COUNT(*) AS count FROM employees WHERE employment_status = 'Active' AND (bank_account_no IS NULL OR TRIM(bank_account_no) = '')`
    );
    if (missingBankCount.count > 0) {
      alerts.push({
        severity: 'WARNING',
        title: 'Missing Bank Details',
        message: `${missingBankCount.count} active employee(s) have missing bank account details.`,
        type: 'bank_info'
      });
    }

    // Check pending leave requests
    const [pendingLeaves] = await query(
      `SELECT COUNT(*) AS count FROM time_off_requests WHERE status = 'Pending'`
    );
    if (pendingLeaves.count > 0) {
      alerts.push({
        severity: 'INFO',
        title: 'Pending Time-Off Approvals',
        message: `${pendingLeaves.count} leave request(s) require manager approval.`,
        type: 'leave_pending'
      });
    }

    // Check draft payruns
    const [draftPayruns] = await query(
      `SELECT COUNT(*) AS count FROM payruns WHERE status = 'draft'`
    );
    if (draftPayruns.count > 0) {
      alerts.push({
        severity: 'ACTION',
        title: 'Uncomputed Payrun in Draft',
        message: `${draftPayruns.count} payrun(s) in draft status waiting for computation.`,
        type: 'payrun_draft'
      });
    }

    return res.json({
      success: true,
      data: {
        kpis: {
          totalNetPaid: Number(salaryStats.total_net_paid),
          totalGrossPaid: Number(salaryStats.total_gross_paid),
          totalDeductionsPaid: Number(salaryStats.total_deductions_paid),
          payslipsGenerated: Number(salaryStats.total_payslips_count),
          averageSalary: Math.round(Number(salaryStats.average_net_salary)),
          totalEmployees: Number(empStats.total_employees),
          activeEmployees: Number(empStats.active_employees),
          approvedTimeOffDays: Number(leaveStats.total_approved_leave_days),
          attendanceHealthPercent
        },
        departmentSalaries,
        monthlyTrends,
        alerts
      }
    });
  } catch (error) {
    next(error);
  }
>>>>>>> feature/backend
}

module.exports = {
  getDashboardMetrics
};
