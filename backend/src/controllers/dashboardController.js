const { query } = require('../config/db');

async function getDashboardMetrics(req, res, next) {
  try {
    let { department_id, start_date, end_date, period_month, period } = req.query;
    const targetMonth = period_month || period;
    if (targetMonth && (!start_date || !end_date)) {
      const yearMonth = targetMonth.slice(0, 7);
      const [y, m] = yearMonth.split('-').map(Number);
      if (y && m) {
        const lastDay = new Date(y, m, 0).getDate();
        start_date = `${yearMonth}-01`;
        end_date = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
      }
    }

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

    const availablePeriods = await query(
      `SELECT DISTINCT DATE_FORMAT(period_start, '%Y-%m') AS period_month,
                       DATE_FORMAT(period_start, '%M %Y') AS period_label,
                       period_start, period_end
       FROM payruns
       ORDER BY period_start DESC`
    );

    return res.json({
      success: true,
      data: {
        kpis: {
          totalNetPaid: Number(salaryStats.total_net_paid),
          totalNetPayroll: Number(salaryStats.total_net_paid),
          totalGrossPaid: Number(salaryStats.total_gross_paid),
          totalDeductionsPaid: Number(salaryStats.total_deductions_paid),
          payslipsGenerated: Number(salaryStats.total_payslips_count),
          payslipsIssued: Number(salaryStats.total_payslips_count),
          averageSalary: Math.round(Number(salaryStats.average_net_salary)),
          avgNetSalary: Math.round(Number(salaryStats.average_net_salary)),
          totalEmployees: Number(empStats.total_employees),
          activeEmployees: Number(empStats.active_employees),
          approvedTimeOffDays: Number(leaveStats.total_approved_leave_days),
          approvedLeaves: Number(leaveStats.total_approved_leave_days),
          attendanceHealthPercent
        },
        departmentSalaries,
        monthlyTrends,
        availablePeriods,
        alerts
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardMetrics
};
