const { query } = require('../config/db');

/**
<<<<<<< HEAD
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
=======
 * Scans for payroll and HR anomalies across payruns, employees, and attendance.
 */
async function detectPayrunAnomalies(payrunId) {
  const anomalies = [];

  // Fetch payrun details
  const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
  if (!payrun) return anomalies;

  // 1. Check for Missing Bank Information for included employees
  const bankMissingEmployees = await query(
    `SELECT e.id, e.first_name, e.last_name, e.employee_code, e.bank_account_no
     FROM payrun_employees pe
     JOIN employees e ON pe.employee_id = e.id
     WHERE pe.payrun_id = ? 
       AND (e.bank_account_no IS NULL OR TRIM(e.bank_account_no) = '' OR e.bank_ifsc IS NULL)`
    , [payrunId]
  );

  for (const emp of bankMissingEmployees) {
    anomalies.push({
      severity: 'HIGH',
      type: 'Missing Bank Details',
      employeeId: emp.id,
      employeeName: `${emp.first_name} ${emp.last_name} (${emp.employee_code})`,
      reason: 'Employee is included in payrun but lacks verified bank account or IFSC information.',
      relatedRecord: { entity: 'employee', id: emp.id }
    });
  }

  // 2. Check for Missing Check-Outs during the payrun period
  const missingCheckouts = await query(
    `SELECT a.id, a.date, e.id AS employee_id, e.first_name, e.last_name, e.employee_code
     FROM attendance a
     JOIN employees e ON a.employee_id = e.id
     JOIN payrun_employees pe ON e.id = pe.employee_id
     WHERE pe.payrun_id = ?
       AND a.date >= ? AND a.date <= ?
       AND a.check_in IS NOT NULL AND a.check_out IS NULL`,
    [payrunId, payrun.period_start, payrun.period_end]
  );

  for (const att of missingCheckouts) {
    anomalies.push({
      severity: 'MEDIUM',
      type: 'Missing Check-Out',
      employeeId: att.employee_id,
      employeeName: `${att.first_name} ${att.last_name} (${att.employee_code})`,
      reason: `Attendance record on ${att.date} has a check-in but no check-out recorded.`,
      relatedRecord: { entity: 'attendance', id: att.id }
    });
  }

  // 3. Salary Spike / Drop (>15% variance compared to previous payrun)
  const currentPayslips = await query(
    `SELECT ps.id, ps.employee_id, ps.net_salary, ps.absent_days, ps.leave_days,
            e.first_name, e.last_name, e.employee_code
     FROM payslips ps
     JOIN employees e ON ps.employee_id = e.id
     WHERE ps.payrun_id = ?`,
    [payrunId]
  );

  for (const currSlip of currentPayslips) {
    // Find latest finalized prior payslip for this employee
    const priorSlips = await query(
      `SELECT ps.id, ps.net_salary, pr.period_start
       FROM payslips ps
       JOIN payruns pr ON ps.payrun_id = pr.id
       WHERE ps.employee_id = ? 
         AND pr.period_start < ?
         AND pr.status IN ('validated', 'paid')
       ORDER BY pr.period_start DESC
       LIMIT 1`,
      [currSlip.employee_id, payrun.period_start]
    );

    if (priorSlips && priorSlips.length > 0) {
      const priorNet = Number(priorSlips[0].net_salary);
      const currNet = Number(currSlip.net_salary);

      if (priorNet > 0) {
        const delta = currNet - priorNet;
        const percentChange = (delta / priorNet) * 100;

        if (Math.abs(percentChange) >= 15.0) {
          const isDrop = percentChange < 0;
          let possibleReason = isDrop 
            ? `${currSlip.absent_days > 0 ? `${currSlip.absent_days} unpaid absent days. ` : ''}Increased deductions or change in applicable contract wage.`
            : 'Contract wage increment or reduced unpaid absences.';

          anomalies.push({
            severity: Math.abs(percentChange) > 25 ? 'HIGH' : 'MEDIUM',
            type: isDrop ? 'Salary Drop Anomaly' : 'Salary Spike Anomaly',
            employeeId: currSlip.employee_id,
            employeeName: `${currSlip.first_name} ${currSlip.last_name} (${currSlip.employee_code})`,
            reason: `Net salary shifted by ${percentChange.toFixed(1)}% (Previous: ₹${priorNet.toLocaleString()}, Current: ₹${currNet.toLocaleString()}). ${possibleReason}`,
            relatedRecord: { entity: 'payslip', id: currSlip.id }
          });
        }
      }
    }
  }

  // 4. Duplicate Payslip Check for the same period
  const duplicates = await query(
    `SELECT ps.id, ps.employee_id, e.first_name, e.last_name
     FROM payslips ps
     JOIN employees e ON ps.employee_id = e.id
     WHERE ps.payrun_id != ?
       AND ps.period_start = ?
       AND ps.period_end = ?
       AND ps.employee_id IN (
         SELECT employee_id FROM payrun_employees WHERE payrun_id = ?
       )`,
    [payrunId, payrun.period_start, payrun.period_end, payrunId]
  );

  for (const dup of duplicates) {
    anomalies.push({
      severity: 'HIGH',
      type: 'Duplicate Payslip',
      employeeId: dup.employee_id,
      employeeName: `${dup.first_name} ${dup.last_name}`,
      reason: `Another payslip already exists for this period (${payrun.period_start} to ${payrun.period_end}).`,
      relatedRecord: { entity: 'payslip', id: dup.id }
    });
>>>>>>> feature/backend
  }

  return anomalies;
}

module.exports = {
  detectPayrunAnomalies
};
