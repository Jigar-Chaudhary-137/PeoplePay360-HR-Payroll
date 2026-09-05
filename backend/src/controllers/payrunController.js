<<<<<<< HEAD
const { query, withTransaction } = require('../config/db');
const { computeEmployeePayslip } = require('../services/payrollEngine');
const { detectPayrunAnomalies } = require('../services/anomalyService');

// Query eligible employees with applicable contracts for Payrun Creation Wizard (Step 2)
async function getEligibleEmployees(req, res) {
  const { salary_structure_id, start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
  }

  let sql = `
    SELECT e.id as employee_id, e.emp_code, e.first_name, e.last_name, e.email,
           d.name as department_name, jp.title as job_title,
           c.id as contract_id, c.contract_code, c.wage, c.start_date as contract_start, c.end_date as contract_end,
           s.id as structure_id, s.name as structure_name,
           e.bank_name, e.bank_account_no, e.bank_ifsc
    FROM employees e
    JOIN contracts c ON c.employee_id = e.id
      AND c.start_date <= ?
      AND (c.end_date IS NULL OR c.end_date >= ?)
      AND c.status IN ('running', 'draft')
    JOIN salary_structures s ON c.salary_structure_id = s.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN job_positions jp ON e.job_position_id = jp.id
    WHERE e.employment_status = 'active'
  `;
  const params = [end_date, start_date];

  if (salary_structure_id) {
    sql += ` AND c.salary_structure_id = ?`;
    params.push(salary_structure_id);
  }

  sql += ` ORDER BY e.id ASC`;

  const employees = await query(sql, params);
  return res.json({ success: true, count: employees.length, data: employees });
}

// List all payruns
async function getPayruns(req, res) {
  const { status, period_month } = req.query;

  let sql = `
    SELECT pr.*,
           s.name as structure_name, s.code as structure_code,
           u.work_email as created_by_email,
           (SELECT COUNT(*) FROM payroll_anomalies a WHERE a.payrun_id = pr.id) as anomaly_count
    FROM payruns pr
    JOIN salary_structures s ON pr.salary_structure_id = s.id
    LEFT JOIN users u ON pr.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND pr.status = ?`;
    params.push(status);
  }

  if (period_month) {
    sql += ` AND pr.period_month = ?`;
    params.push(period_month);
  }

  sql += ` ORDER BY pr.period_month DESC, pr.id DESC`;

  const payruns = await query(sql, params);
  return res.json({ success: true, count: payruns.length, data: payruns });
}

// Get single Payrun detail with payslips & anomalies
async function getPayrunById(req, res) {
  const { id } = req.params;

  const payruns = await query(
    `SELECT pr.*,
            s.name as structure_name, s.code as structure_code,
            u.work_email as created_by_email
     FROM payruns pr
     JOIN salary_structures s ON pr.salary_structure_id = s.id
     LEFT JOIN users u ON pr.created_by = u.id
     WHERE pr.id = ?`,
    [id]
  );

  if (payruns.length === 0) {
    return res.status(404).json({ success: false, message: 'Payrun not found.' });
  }

  const payrun = payruns[0];

  // Payslips in this payrun
  const payslips = await query(
    `SELECT p.*,
            e.emp_code, e.first_name, e.last_name, e.email, e.bank_name, e.bank_account_no, e.bank_ifsc,
            d.name as department_name, jp.title as job_title,
            c.contract_code, c.wage as base_wage
     FROM payslips p
     JOIN employees e ON p.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     JOIN contracts c ON p.contract_id = c.id
     WHERE p.payrun_id = ?
     ORDER BY e.id ASC`,
    [id]
  );

  // Anomalies in this payrun
  const anomalies = await query(
    `SELECT a.*, e.emp_code, e.first_name, e.last_name
     FROM payroll_anomalies a
     JOIN employees e ON a.employee_id = e.id
     WHERE a.payrun_id = ?
     ORDER BY a.severity = 'critical' DESC, a.severity = 'warning' DESC, a.created_at ASC`,
    [id]
  );

  // Payrun Included Employees
  const includedEmployees = await query(
    `SELECT pe.*, e.emp_code, e.first_name, e.last_name, c.contract_code, c.wage
     FROM payrun_employees pe
     JOIN employees e ON pe.employee_id = e.id
     JOIN contracts c ON pe.contract_id = c.id
     WHERE pe.payrun_id = ?`,
    [id]
  );

  return res.json({
    success: true,
    data: {
      ...payrun,
      payslips,
      anomalies,
      included_employees: includedEmployees
    }
  });
}

// Create new Payrun (2-Step Wizard Submission)
async function createPayrun(req, res) {
  const { name, period_month, start_date, end_date, salary_structure_id, selected_employee_ids } = req.body;

  if (!period_month || !start_date || !end_date || !salary_structure_id || !Array.isArray(selected_employee_ids) || selected_employee_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Period, dates, salary structure, and selected employees are required.'
    });
  }

  // Generate unique code: PR-YYYY-MM
  const payrunCode = `PR-${period_month}`;

  // Check if payrun with this period already exists
  const existing = await query('SELECT id, status FROM payruns WHERE period_month = ?', [period_month]);
  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Payrun for period ${period_month} already exists (ID #${existing[0].id}, Status: ${existing[0].status}).`
    });
  }

  const payrunName = name || `Regular Payrun - ${period_month}`;
  const userId = req.user.id;

  const payrunId = await withTransaction(async (conn) => {
    const [insertRes] = await conn.query(
      `INSERT INTO payruns (payrun_code, name, period_month, start_date, end_date, salary_structure_id, status, employee_count, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [payrunCode, payrunName, period_month, start_date, end_date, salary_structure_id, selected_employee_ids.length, userId]
    );

    const newId = insertRes.insertId;

    // Attach eligible contract for each selected employee
    for (const empId of selected_employee_ids) {
      const [cnt] = await conn.query(
        `SELECT id FROM contracts
         WHERE employee_id = ?
           AND start_date <= ?
           AND (end_date IS NULL OR end_date >= ?)
           AND status IN ('running', 'draft')
         ORDER BY start_date DESC LIMIT 1`,
        [empId, end_date, start_date]
      );

      if (cnt.length > 0) {
        await conn.query(
          `INSERT INTO payrun_employees (payrun_id, employee_id, contract_id, status)
           VALUES (?, ?, ?, 'included')`,
          [newId, empId, cnt[0].id]
        );
      }
    }

    return newId;
  });

  return res.status(201).json({
    success: true,
    message: `Payrun "${payrunName}" created in Draft state with ${selected_employee_ids.length} employees.`,
    payrun_id: payrunId,
    payrun_code: payrunCode
  });
}

// Compute Payrun (Runs Dynamic Salary Engine for each employee)
async function computePayrun(req, res) {
  const { id } = req.params;

  const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
  if (!payrun) {
    return res.status(404).json({ success: false, message: 'Payrun not found.' });
  }

  if (payrun.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Cannot recompute a payrun that is already marked Paid.' });
  }

  // Get all included employees and their contracts
  const included = await query(
    `SELECT employee_id, contract_id FROM payrun_employees WHERE payrun_id = ? AND status = 'included'`,
    [id]
  );

  if (included.length === 0) {
    return res.status(400).json({ success: false, message: 'No employees included in this payrun.' });
  }

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  await withTransaction(async (conn) => {
    // Clear old payslips for this payrun if recomputing
    await conn.query('DELETE FROM payslips WHERE payrun_id = ?', [id]);

    for (const emp of included) {
      const result = await computeEmployeePayslip(emp.employee_id, payrun, emp.contract_id);
      totalGross += result.grossSalary;
      totalDeductions += result.totalDeductions;
      totalNet += result.netSalary;

      const [empData] = await conn.query('SELECT emp_code FROM employees WHERE id = ?', [emp.employee_id]);
      const payslipCode = `PS-${payrun.period_month}-${empData[0].emp_code}`;

      const [psRes] = await conn.query(
        `INSERT INTO payslips (
          payslip_code, payrun_id, employee_id, contract_id, salary_structure_id,
          period_month, start_date, end_date, worked_days, total_days,
          unpaid_leave_days, paid_leave_days, gross_salary, total_deductions,
          net_salary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'computed')`,
        [
          payslipCode, id, emp.employee_id, result.contract.id, result.structureId,
          payrun.period_month, payrun.start_date, payrun.end_date, result.workedDays,
          result.totalDays, result.unpaidLeaveDays, result.paidLeaveDays,
          result.grossSalary, result.totalDeductions, result.netSalary
        ]
      );

      const payslipId = psRes.insertId;

      // Insert itemized payslip breakdown lines
      for (const line of result.lines) {
        await conn.query(
          `INSERT INTO payslip_lines (
            payslip_id, rule_id, rule_code, rule_name, category, sequence,
            amount, rate, base_amount, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payslipId, line.rule_id, line.rule_code, line.rule_name, line.category,
            line.sequence, line.amount, line.rate, line.base_amount, line.notes
          ]
=======
const { query, getTransactionConnection } = require('../config/db');
const { computeEmployeePayroll } = require('../services/payrollEngine');
const { detectPayrunAnomalies } = require('../services/anomalyService');
const { logAudit } = require('../utils/auditLogger');

/**
 * Step 2 helper: lists employees who have a valid contract for the selected period & structure
 */
async function getEligibleEmployees(req, res, next) {
  try {
    const { salary_structure_id, period_start, period_end } = req.query;
    if (!salary_structure_id || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'salary_structure_id, period_start, and period_end are required query parameters.'
      });
    }

    const employees = await query(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.email,
              e.bank_name, e.bank_account_no, e.bank_ifsc,
              d.name AS department_name,
              jp.title AS job_position_title,
              c.id AS contract_id, c.contract_code, c.wage, c.start_date, c.end_date
       FROM employees e
       JOIN contracts c ON e.id = c.employee_id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE e.employment_status = 'Active'
         AND c.salary_structure_id = ?
         AND c.start_date <= ?
         AND (c.end_date IS NULL OR c.end_date >= ?)
         AND c.status IN ('Running', 'Expired')
       ORDER BY e.first_name ASC`,
      [salary_structure_id, period_end, period_start]
    );

    return res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    next(error);
  }
}

async function getPayruns(req, res, next) {
  try {
    const { status } = req.query;
    let sql = `
      SELECT pr.*, 
             ss.name AS salary_structure_name,
             COUNT(DISTINCT pe.employee_id) AS total_employees_count,
             COUNT(DISTINCT ps.id) AS computed_payslips_count,
             u.email AS created_by_email
      FROM payruns pr
      JOIN salary_structures ss ON pr.salary_structure_id = ss.id
      LEFT JOIN payrun_employees pe ON pr.id = pe.payrun_id AND pe.status = 'included'
      LEFT JOIN payslips ps ON pr.id = ps.payrun_id
      LEFT JOIN users u ON pr.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND pr.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY pr.id ORDER BY pr.period_start DESC';

    const payruns = await query(sql, params);
    return res.json({ success: true, data: payruns });
  } catch (error) {
    next(error);
  }
}

async function getPayrunById(req, res, next) {
  try {
    const { id } = req.params;
    const [payrun] = await query(
      `SELECT pr.*, ss.name AS salary_structure_name
       FROM payruns pr
       JOIN salary_structures ss ON pr.salary_structure_id = ss.id
       WHERE pr.id = ?`,
      [id]
    );

    if (!payrun) {
      return res.status(404).json({ success: false, message: `Payrun ${id} not found.` });
    }

    // Included employees
    payrun.employees = await query(
      `SELECT pe.*, 
              e.first_name, e.last_name, e.employee_code, e.bank_account_no,
              d.name AS department_name, jp.title AS job_position_title,
              c.contract_code, c.wage
       FROM payrun_employees pe
       JOIN employees e ON pe.employee_id = e.id
       JOIN contracts c ON pe.contract_id = c.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE pe.payrun_id = ?`,
      [id]
    );

    // Payslips if computed
    payrun.payslips = await query(
      `SELECT ps.*, 
              e.first_name, e.last_name, e.employee_code, e.bank_account_no,
              d.name AS department_name
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE ps.payrun_id = ?
       ORDER BY e.first_name ASC`,
      [id]
    );

    // Anomalies
    payrun.anomalies = await detectPayrunAnomalies(id);

    return res.json({ success: true, data: payrun });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates Payrun after Step 2 (Wizard submission)
 */
async function createPayrun(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const {
      name,
      salary_structure_id,
      period_start,
      period_end,
      pay_date,
      employee_selections = [] // Array of { employee_id, contract_id }
    } = req.body;

    if (!name || !salary_structure_id || !period_start || !period_end || !pay_date) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name, salary_structure_id, period_start, period_end, and pay_date are required.'
      });
    }

    if (employee_selections.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one employee must be selected to create a payrun.'
      });
    }

    // Insert payrun
    const [resPayrun] = await conn.query(
      `INSERT INTO payruns (
        name, salary_structure_id, period_start, period_end, pay_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
      [name, salary_structure_id, period_start, period_end, pay_date, req.user?.id || null]
    );

    const payrunId = resPayrun.insertId;

    // Insert selected employees
    for (const sel of employee_selections) {
      await conn.query(
        `INSERT INTO payrun_employees (payrun_id, employee_id, contract_id, status)
         VALUES (?, ?, ?, 'included')`,
        [payrunId, sel.employee_id, sel.contract_id]
      );
    }

    await conn.commit();
    await logAudit(req.user?.id, 'CREATE_PAYRUN', 'payrun', payrunId, { name, period_start, period_end, count: employee_selections.length });

    const [created] = await query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
    return res.status(201).json({
      success: true,
      message: 'Payrun created in draft state.',
      data: created
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * Executes Payroll Engine for all selected employees in transaction
 */
async function computePayrun(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { id } = req.params;

    const [payrunRows] = await conn.query('SELECT * FROM payruns WHERE id = ? FOR UPDATE', [id]);
    if (!payrunRows || payrunRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Payrun not found.' });
    }

    const payrun = payrunRows[0];
    if (payrun.status === 'validated' || payrun.status === 'paid') {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot re-compute: Payrun is already ${payrun.status} and locked.`
      });
    }

    // Fetch included employees
    const [included] = await conn.query(
      'SELECT employee_id, contract_id FROM payrun_employees WHERE payrun_id = ? AND status = "included"',
      [id]
    );

    if (included.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'No employees are included in this payrun.'
      });
    }

    let payrunGross = 0;
    let payrunDeductions = 0;
    let payrunNet = 0;

    // Delete existing payslips if recomputing draft
    await conn.query('DELETE FROM payslips WHERE payrun_id = ?', [id]);

    for (const emp of included) {
      // Calculate salary through backend engine
      const calculation = await computeEmployeePayroll(
        emp.employee_id,
        payrun.period_start,
        payrun.period_end,
        payrun.salary_structure_id
      );

      payrunGross += calculation.grossSalary;
      payrunDeductions += calculation.totalDeductions;
      payrunNet += calculation.netSalary;

      // Insert payslip
      const [resSlip] = await conn.query(
        `INSERT INTO payslips (
          payrun_id, employee_id, contract_id, salary_structure_id,
          period_start, period_end, scheduled_days, worked_days, absent_days, leave_days,
          gross_salary, total_deductions, net_salary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'computed')`,
        [
          id, emp.employee_id, calculation.contract.id, calculation.salaryStructureId,
          calculation.periodStart, calculation.periodEnd,
          calculation.scheduledDays, calculation.workedDays, calculation.absentDays, calculation.leaveDays,
          calculation.grossSalary, calculation.totalDeductions, calculation.netSalary
        ]
      );

      const payslipId = resSlip.insertId;

      // Insert itemized payslip lines
      for (const line of calculation.lines) {
        await conn.query(
          `INSERT INTO payslip_lines (payslip_id, rule_id, code, name, category, sequence, amount)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payslipId, line.rule_id, line.code, line.name, line.category, line.sequence, line.amount]
>>>>>>> feature/backend
        );
      }
    }

<<<<<<< HEAD
    // Update Payrun totals and state
    await conn.query(
      `UPDATE payruns SET
         total_gross = ?, total_deductions = ?, total_net = ?,
         employee_count = ?, status = 'computed'
       WHERE id = ?`,
      [totalGross, totalDeductions, totalNet, included.length, id]
    );
  });

  // Run anomaly detection scan
  const anomalies = await detectPayrunAnomalies(id);

  return res.json({
    success: true,
    message: `Payrun computed successfully. Total Net Salary: ₹${Number(totalNet).toLocaleString()}. Detected ${anomalies.length} anomaly warnings.`,
    totals: {
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      employee_count: included.length
    },
    anomaly_count: anomalies.length
  });
}

// Validate Payrun (Locks calculations and finalizes)
async function validatePayrun(req, res) {
  const { id } = req.params;

  const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
  if (!payrun) {
    return res.status(404).json({ success: false, message: 'Payrun not found.' });
  }

  if (payrun.status !== 'computed') {
    return res.status(400).json({ success: false, message: `Cannot validate payrun in status "${payrun.status}". Payrun must be in "computed" status first.` });
  }

  await withTransaction(async (conn) => {
    await conn.query(`UPDATE payruns SET status = 'validated' WHERE id = ?`, [id]);
    await conn.query(`UPDATE payslips SET status = 'validated' WHERE payrun_id = ?`, [id]);
  });

  return res.json({
    success: true,
    message: `Payrun ${payrun.payrun_code} successfully validated and finalized.`
  });
}

// Mark Paid (Records payment status and disbursement timestamp)
async function markPaid(req, res) {
  const { id } = req.params;

  const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
  if (!payrun) {
    return res.status(404).json({ success: false, message: 'Payrun not found.' });
  }

  if (payrun.status !== 'validated') {
    return res.status(400).json({ success: false, message: `Cannot mark paid from status "${payrun.status}". Payrun must be validated first.` });
  }

  await withTransaction(async (conn) => {
    await conn.query(`UPDATE payruns SET status = 'paid', paid_at = NOW() WHERE id = ?`, [id]);
    await conn.query(`UPDATE payslips SET status = 'paid' WHERE payrun_id = ?`, [id]);
  });

  return res.json({
    success: true,
    message: `Payrun ${payrun.payrun_code} marked as Paid. Bank disbursement recorded.`
  });
=======
    // Update payrun totals and status to 'computed'
    await conn.query(
      `UPDATE payruns SET
        status = 'computed',
        total_gross = ?,
        total_deductions = ?,
        total_net = ?
       WHERE id = ?`,
      [payrunGross, payrunDeductions, payrunNet, id]
    );

    await conn.commit();
    await logAudit(req.user?.id, 'COMPUTE_PAYRUN', 'payrun', id, { total_net: payrunNet, employee_count: included.length });

    // Detect anomalies after computation
    const anomalies = await detectPayrunAnomalies(id);

    const [updated] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: `Payrun successfully computed for ${included.length} employees.`,
      data: {
        payrun: updated,
        anomalies
      }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

/**
 * Validates Payrun, locking it from modifications
 */
async function validatePayrun(req, res, next) {
  try {
    const { id } = req.params;
    const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
    if (!payrun) {
      return res.status(404).json({ success: false, message: 'Payrun not found.' });
    }

    if (payrun.status !== 'computed') {
      return res.status(400).json({
        success: false,
        message: `Cannot validate payrun in '${payrun.status}' state. Must be 'computed'.`
      });
    }

    await query(
      `UPDATE payruns SET status = 'validated', validated_by = ? WHERE id = ?`,
      [req.user?.id || null, id]
    );
    await query(`UPDATE payslips SET status = 'confirmed' WHERE payrun_id = ?`, [id]);

    await logAudit(req.user?.id, 'VALIDATE_PAYRUN', 'payrun', id, { total_net: payrun.total_net });

    const [updated] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Payrun successfully validated and locked.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Marks Payrun as Paid and updates timestamps
 */
async function markPayrunPaid(req, res, next) {
  try {
    const { id } = req.params;
    const [payrun] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
    if (!payrun) {
      return res.status(404).json({ success: false, message: 'Payrun not found.' });
    }

    if (payrun.status !== 'validated') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark paid: Payrun must be in 'validated' state (current: '${payrun.status}').`
      });
    }

    await query(
      `UPDATE payruns SET status = 'paid', paid_at = NOW() WHERE id = ?`,
      [id]
    );
    await query(`UPDATE payslips SET status = 'paid' WHERE payrun_id = ?`, [id]);

    await logAudit(req.user?.id, 'MARK_PAYRUN_PAID', 'payrun', id, { total_net: payrun.total_net });

    const [updated] = await query('SELECT * FROM payruns WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Payrun marked as PAID successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function getPayrunAnomalies(req, res, next) {
  try {
    const { id } = req.params;
    const anomalies = await detectPayrunAnomalies(id);
    return res.json({ success: true, data: anomalies });
  } catch (error) {
    next(error);
  }
>>>>>>> feature/backend
}

module.exports = {
  getEligibleEmployees,
  getPayruns,
  getPayrunById,
  createPayrun,
  computePayrun,
  validatePayrun,
<<<<<<< HEAD
  markPaid
=======
  markPayrunPaid,
  getPayrunAnomalies
>>>>>>> feature/backend
};
