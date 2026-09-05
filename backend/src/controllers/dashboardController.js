const { query } = require('../config/db');

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
}

module.exports = {
  getDashboardMetrics
};
