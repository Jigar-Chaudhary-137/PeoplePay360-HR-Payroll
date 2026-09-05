const { query, getTransactionConnection } = require('../config/db');
const { computeEmployeePayroll } = require('../services/payrollEngine');
const { detectPayrunAnomalies } = require('../services/anomalyService');
const { logAudit } = require('../utils/auditLogger');
const { notifyPayrollAdmins } = require('../services/notificationService');

/**
 * Step 2 helper: lists employees who have a valid contract for the selected period & structure
 */
async function getEligibleEmployees(req, res, next) {
  try {
    const { salary_structure_id } = req.query;
    const period_start = req.query.period_start || req.query.start_date;
    const period_end = req.query.period_end || req.query.end_date;

    if (!salary_structure_id || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'salary_structure_id, period_start, and period_end are required query parameters.'
      });
    }

    const employees = await query(
      `SELECT e.id, e.id AS employee_id, 
              e.employee_code, e.employee_code AS emp_code,
              e.first_name, e.last_name, e.email,
              e.bank_name, e.bank_account_no, e.bank_ifsc,
              d.name AS department_name,
              jp.title AS job_position_title, jp.title AS job_title,
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
      start_date,
      end_date,
      pay_date,
      employee_selections = [], // Array of { employee_id, contract_id }
      employee_ids = []
    } = req.body;

    const finalStart = period_start || start_date;
    const finalEnd = period_end || end_date;
    const finalPayDate = pay_date || finalEnd;

    if (!name || !salary_structure_id || !finalStart || !finalEnd) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name, salary_structure_id, period_start/start_date, and period_end/end_date are required.'
      });
    }

    // Build selections from employee_selections or employee_ids
    let selections = [...employee_selections];
    if (selections.length === 0 && Array.isArray(employee_ids) && employee_ids.length > 0) {
      for (const empId of employee_ids) {
        const idVal = typeof empId === 'object' ? (empId.employee_id || empId.id) : empId;
        if (!idVal) continue;
        const [contracts] = await conn.query(
          `SELECT id FROM contracts 
           WHERE employee_id = ? AND salary_structure_id = ? 
             AND status IN ('Running', 'Expired') 
           ORDER BY id DESC LIMIT 1`,
          [idVal, salary_structure_id]
        );
        const contractId = contracts && contracts.length > 0 ? contracts[0].id : null;
        if (contractId) {
          selections.push({ employee_id: idVal, contract_id: contractId });
        }
      }
    }

    if (selections.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one employee with a valid contract must be selected to create a payrun.'
      });
    }

    // Insert payrun
    const [resPayrun] = await conn.query(
      `INSERT INTO payruns (
        name, salary_structure_id, period_start, period_end, pay_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
      [name, salary_structure_id, finalStart, finalEnd, finalPayDate, req.user?.id || null]
    );

    const payrunId = resPayrun.insertId;

    // Insert selected employees
    for (const sel of selections) {
      await conn.query(
        `INSERT INTO payrun_employees (payrun_id, employee_id, contract_id, status)
         VALUES (?, ?, ?, 'included')`,
        [payrunId, sel.employee_id, sel.contract_id]
      );
    }

    await conn.commit();
    await logAudit(req.user?.id, 'CREATE_PAYRUN', 'payrun', payrunId, { name, period_start: finalStart, period_end: finalEnd, count: selections.length });

    const [created] = await query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
    return res.status(201).json({
      success: true,
      message: 'Payrun created in draft state.',
      payrun_id: payrunId,
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
        );
      }
    }

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

    // Notify payroll and admin users
    await notifyPayrollAdmins(
      'Payrun Validated',
      `Payrun "${payrun.name}" (${payrun.period_start} to ${payrun.period_end}) has been validated and locked. Total Net: ₹${Number(payrun.total_net).toLocaleString('en-IN')}.`,
      'success',
      payrun.created_by
    );

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
}

module.exports = {
  getEligibleEmployees,
  getPayruns,
  getPayrunById,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  getPayrunAnomalies
};
