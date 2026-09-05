const { query } = require('../config/db');

/**
 * Safely evaluates simple arithmetic formula expressions
 * Supported tokens: component names, numbers, +, -, *, /, (, )
 */
function evaluateFormula(expression, context) {
  if (!expression || typeof expression !== 'string') return 0;

  // Replace variable names with their numerical values
  let expr = expression;
  // Sort keys by length descending to prevent sub-string prefix collisions
  const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const val = Number(context[key]) || 0;
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(regex, `(${val})`);
  }

  // Sanitize to only allow valid math characters
  const sanitized = expr.replace(/[^0-9+\-*/(). ]/g, '');
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized});`)();
    return isFinite(result) ? Math.max(0, Math.round(result * 100) / 100) : 0;
  } catch (err) {
    console.error(`[PayrollEngine] Failed to evaluate formula "${expression}":`, err.message);
    return 0;
  }
}

/**
 * Finds the applicable contract for an employee during a given payrun period
 */
async function getApplicableContract(employeeId, startDate, endDate, specificContractId = null) {
  if (specificContractId) {
    const contracts = await query(
      `SELECT c.*, s.name as structure_name
       FROM contracts c
       JOIN salary_structures s ON c.salary_structure_id = s.id
       WHERE c.id = ? AND c.employee_id = ?`,
      [specificContractId, employeeId]
    );
    if (contracts.length > 0) return contracts[0];
  }

  const contracts = await query(
    `SELECT c.*, s.name as structure_name
     FROM contracts c
     JOIN salary_structures s ON c.salary_structure_id = s.id
     WHERE c.employee_id = ?
       AND c.start_date <= ?
       AND (c.end_date IS NULL OR c.end_date >= ?)
       AND c.status IN ('running', 'draft')
     ORDER BY c.start_date DESC
     LIMIT 1`,
    [employeeId, endDate, startDate]
  );

  return contracts.length > 0 ? contracts[0] : null;
}

/**
 * Calculates attendance, worked days, and approved time off for an employee in period
 */
async function getPeriodAttendanceAndLeaves(employeeId, startDate, endDate) {
  // Calendar days between startDate and endDate inclusive
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Attendance records in period
  const attendanceRecords = await query(
    `SELECT date, status, worked_hours, notes
     FROM attendance
     WHERE employee_id = ? AND date >= ? AND date <= ?`,
    [employeeId, startDate, endDate]
  );

  // Time off requests approved in period
  const approvedLeaves = await query(
    `SELECT r.*, t.code as type_code, t.name as type_name
     FROM time_off_requests r
     JOIN time_off_types t ON r.time_off_type_id = t.id
     WHERE r.employee_id = ?
       AND r.status = 'approved'
       AND r.start_date <= ? AND r.end_date >= ?`,
    [employeeId, endDate, startDate]
  );

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  for (const leave of approvedLeaves) {
    const amt = Number(leave.requested_amount) || 0;
    if (leave.type_code === 'LOP') {
      unpaidLeaveDays += amt;
    } else {
      paidLeaveDays += amt;
    }
  }

  // Count unapproved absent days from attendance
  const unapprovedAbsents = attendanceRecords.filter(a => a.status === 'absent').length;
  unpaidLeaveDays += unapprovedAbsents;

  // Worked days calculated
  const workedDays = Math.max(0, totalDays - unpaidLeaveDays);

  return {
    totalDays,
    workedDays,
    paidLeaveDays,
    unpaidLeaveDays,
    attendanceRecords,
    approvedLeaves
  };
}

/**
 * Computes complete salary breakdown for an employee in a payrun
 */
async function computeEmployeePayslip(employeeId, payrun, specificContractId = null) {
  const { start_date, end_date, salary_structure_id } = payrun;

  // 1. Get applicable contract
  const contract = await getApplicableContract(employeeId, start_date, end_date, specificContractId);
  if (!contract) {
    throw new Error(`No applicable contract found for Employee ID ${employeeId} during period ${start_date} to ${end_date}`);
  }

  // Structure ID precedence: Contract's structure or Payrun's structure
  const structureId = contract.salary_structure_id || salary_structure_id;

  // 2. Get attendance and time off metrics
  const attendanceMetrics = await getPeriodAttendanceAndLeaves(employeeId, start_date, end_date);
  const { totalDays, workedDays, paidLeaveDays, unpaidLeaveDays } = attendanceMetrics;

  // 3. Load active salary rules for the structure ordered by sequence
  const rules = await query(
    `SELECT sr.*, COALESCE(ssr.sequence_override, sr.sequence) as effective_sequence
     FROM salary_rules sr
     JOIN salary_structure_rules ssr ON sr.id = ssr.rule_id
     WHERE ssr.structure_id = ? AND sr.is_active = TRUE
     ORDER BY effective_sequence ASC`,
    [structureId]
  );

  if (rules.length === 0) {
    throw new Error(`No active salary rules configured for Salary Structure ID ${structureId}`);
  }

  // 4. Runtime calculation context
  const wage = Number(contract.wage) || 0;
  const context = {
    WAGE: wage,
    TOTAL_DAYS: totalDays,
    WORKED_DAYS: workedDays,
    PAID_LEAVES: paidLeaveDays,
    UNPAID_LEAVES: unpaidLeaveDays
  };

  const payslipLines = [];
  let grossSalary = 0;
  let totalDeductions = 0;
  let netSalary = 0;

  for (const rule of rules) {
    let lineAmount = 0;
    let baseAmount = 0;
    let rate = Number(rule.percentage) || 0;

    switch (rule.calculation_type) {
      case 'PRORATED_DAYS': {
        // Base prorated on worked days / total days
        baseAmount = wage;
        const prorationRatio = totalDays > 0 ? (workedDays / totalDays) : 1;
        lineAmount = Math.round(wage * (rate / 100) * prorationRatio * 100) / 100;
        break;
      }
      case 'PERCENT_BASIC': {
        baseAmount = context['BASIC'] || 0;
        lineAmount = Math.round(baseAmount * (rate / 100) * 100) / 100;
        break;
      }
      case 'PERCENT_COMPONENT': {
        const compCode = rule.component_code || 'BASIC';
        baseAmount = context[compCode] || 0;
        lineAmount = Math.round(baseAmount * (rate / 100) * 100) / 100;
        break;
      }
      case 'FIXED': {
        lineAmount = Number(rule.fixed_amount) || 0;
        baseAmount = lineAmount;
        break;
      }
      case 'FORMULA': {
        lineAmount = evaluateFormula(rule.formula_expression, context);
        baseAmount = lineAmount;
        break;
      }
      default:
        lineAmount = Number(rule.fixed_amount) || 0;
    }

    // Register into context for downstream rules
    context[rule.code] = lineAmount;

    // Track aggregates
    if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE') {
      grossSalary += lineAmount;
    } else if (rule.category === 'DEDUCTION') {
      totalDeductions += lineAmount;
    }

    payslipLines.push({
      rule_id: rule.id,
      rule_code: rule.code,
      rule_name: rule.name,
      category: rule.category,
      sequence: rule.effective_sequence,
      amount: lineAmount,
      rate: rate,
      base_amount: baseAmount,
      notes: `${rule.calculation_type} calculation`
    });
  }

  // If explicit GROSS rule was evaluated, use it, else computed sum
  if (context['GROSS'] !== undefined && context['GROSS'] > 0) {
    grossSalary = context['GROSS'];
  }

  // Calculate Net Salary: Gross - Total Deductions
  if (context['NET'] !== undefined && context['NET'] > 0) {
    netSalary = context['NET'];
  } else {
    netSalary = Math.max(0, grossSalary - totalDeductions);
  }

  return {
    contract,
    structureId,
    wage,
    totalDays,
    workedDays,
    paidLeaveDays,
    unpaidLeaveDays,
    grossSalary: Math.round(grossSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    lines: payslipLines
  };
}

module.exports = {
  getApplicableContract,
  getPeriodAttendanceAndLeaves,
  computeEmployeePayslip,
  evaluateFormula
};
