const { query } = require('../config/db');

/**
 * Scans a payrun and its payslips for operational and financial anomalies
 */
async function detectPayrunAnomalies(payrunId) {
  // Clear existing anomalies for this payrun to ensure clean re-computations
  await query('DELETE FROM payroll_anomalies WHERE payrun_id = ?', [payrunId]);

  // Load payrun details
  const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
  if (!payrun) return [];

  // Load all payslips in this payrun with employee details
  const payslips = await query(
    `SELECT p.*, e.emp_code, e.first_name, e.last_name, e.bank_account_no, e.bank_ifsc, e.bank_name
     FROM payslips p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.payrun_id = ?`,
    [payrunId]
  );

  const anomalies = [];

  for (const ps of payslips) {
    const employeeName = `${ps.first_name} ${ps.last_name} (${ps.emp_code})`;

    // Check 1: Missing Bank Information
    if (!ps.bank_account_no || !ps.bank_ifsc || ps.bank_account_no.trim() === '') {
      const anomaly = {
        payrun_id: payrunId,
        payslip_id: ps.id,
        employee_id: ps.employee_id,
        severity: 'warning',
        type: 'MISSING_BANK_INFO',
        title: `Missing Banking Information`,
        reason: `Employee ${employeeName} has missing bank account number or IFSC code required for automated salary disbursement.`,
        previous_value: null,
        current_value: 'No Bank Details'
      };
      anomalies.push(anomaly);
    }

    // Check 2: Large Salary Variance compared to previous month
    const previousPayslips = await query(
      `SELECT net_salary, gross_salary, period_month
       FROM payslips
       WHERE employee_id = ? AND period_month < ? AND status IN ('validated', 'paid')
       ORDER BY period_month DESC
       LIMIT 1`,
      [ps.employee_id, ps.period_month]
    );

    if (previousPayslips.length > 0) {
      const prevNet = Number(previousPayslips[0].net_salary);
      const currNet = Number(ps.net_salary);

      if (prevNet > 0) {
        const diff = currNet - prevNet;
        const percentChange = ((diff / prevNet) * 100);

        if (Math.abs(percentChange) >= 15) {
          const isDecrease = percentChange < 0;
          const reasons = [];
          if (ps.unpaid_leave_days > 0) {
            reasons.push(`${ps.unpaid_leave_days} unpaid leave / absent days`);
          }
          if (ps.gross_salary !== previousPayslips[0].gross_salary) {
            reasons.push(`Base contract or earnings changed from ₹${Number(previousPayslips[0].gross_salary).toLocaleString()} to ₹${Number(ps.gross_salary).toLocaleString()}`);
          }

          const anomaly = {
            payrun_id: payrunId,
            payslip_id: ps.id,
            employee_id: ps.employee_id,
            severity: Math.abs(percentChange) > 30 ? 'critical' : 'warning',
            type: 'SALARY_VARIANCE',
            title: `Significant Salary ${isDecrease ? 'Reduction' : 'Spike'} (${percentChange.toFixed(1)}%)`,
            reason: `Net salary changed from ₹${prevNet.toLocaleString()} in ${previousPayslips[0].period_month} to ₹${currNet.toLocaleString()} in ${ps.period_month} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%). Root causes: ${reasons.length ? reasons.join(', ') : 'Variable statutory deductions / rule updates'}.`,
            previous_value: `₹${prevNet.toLocaleString()}`,
            current_value: `₹${currNet.toLocaleString()}`
          };
          anomalies.push(anomaly);
        }
      }
    }

    // Check 3: Attendance Gaps / Unapproved Absences
    if (Number(ps.unpaid_leave_days) > 0) {
      const anomaly = {
        payrun_id: payrunId,
        payslip_id: ps.id,
        employee_id: ps.employee_id,
        severity: 'info',
        type: 'ATTENDANCE_GAP',
        title: `Unpaid Absences Detected (${ps.unpaid_leave_days} Days)`,
        reason: `Employee ${employeeName} has ${ps.unpaid_leave_days} unpaid leave or unapproved absence days during ${ps.period_month}, resulting in prorated salary.`,
        previous_value: '0 Unpaid Days',
        current_value: `${ps.unpaid_leave_days} Days`
      };
      anomalies.push(anomaly);
    }

    // Check 4: Duplicate Payslip in finalized payruns
    const duplicateCheck = await query(
      `SELECT id, payrun_id
       FROM payslips
       WHERE employee_id = ? AND period_month = ? AND id != ? AND status IN ('validated', 'paid')`,
      [ps.employee_id, ps.period_month, ps.id]
    );

    if (duplicateCheck.length > 0) {
      const anomaly = {
        payrun_id: payrunId,
        payslip_id: ps.id,
        employee_id: ps.employee_id,
        severity: 'critical',
        type: 'DUPLICATE_PAYSLIP',
        title: `Duplicate Payslip Conflict`,
        reason: `Employee ${employeeName} already has a finalized or paid payslip for period ${ps.period_month} in Payrun ID #${duplicateCheck[0].payrun_id}.`,
        previous_value: `Payrun #${duplicateCheck[0].payrun_id}`,
        current_value: `Payrun #${payrunId}`
      };
      anomalies.push(anomaly);
    }
  }

  // Insert anomalies into database
  for (const a of anomalies) {
    await query(
      `INSERT INTO payroll_anomalies (payrun_id, payslip_id, employee_id, severity, type, title, reason, previous_value, current_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.payrun_id, a.payslip_id, a.employee_id, a.severity, a.type, a.title, a.reason, a.previous_value, a.current_value]
    );
  }

  return anomalies;
}

module.exports = {
  detectPayrunAnomalies
};
