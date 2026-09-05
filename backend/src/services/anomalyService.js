const { query } = require('../config/db');

/**
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
  }

  return anomalies;
}

module.exports = {
  detectPayrunAnomalies
};
