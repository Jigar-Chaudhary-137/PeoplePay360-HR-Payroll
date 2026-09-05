const { query } = require('../config/db');
<<<<<<< HEAD

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
=======
const { findApplicableContract } = require('./contractService');

/**
 * Evaluates a safe mathematical expression using the provided calculation scope.
 * Supports +, -, *, /, (, ), and LEAST(a, b), MIN(a, b), MAX(a, b).
 */
function evaluateFormula(formulaStr, scope) {
  if (!formulaStr || typeof formulaStr !== 'string') {
    return 0;
  }

  let expr = formulaStr.toUpperCase();

  // Replace functions
  expr = expr.replace(/\b(LEAST|MIN)\s*\(/gi, 'Math.min(');
  expr = expr.replace(/\bMAX\s*\(/gi, 'Math.max(');

  // Replace identifiers with scope values
  // Sort identifiers by length descending so longer words replace before shorter substrings
  const identifiers = Object.keys(scope).sort((a, b) => b.length - a.length);
  for (const id of identifiers) {
    const regex = new RegExp(`\\b${id}\\b`, 'g');
    expr = expr.replace(regex, scope[id]);
  }

  // Safety check: ensure expression only contains math operators and numbers
  const sanitized = expr.replace(/Math\.(min|max)/g, '');
  if (!/^[\d\s+\-*/().,]+$/.test(sanitized)) {
    console.warn(`[PayrollEngine] Potentially unsafe or invalid formula: "${formulaStr}" resolved to "${expr}"`);
    return 0;
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${expr});`)();
    return isNaN(result) || !isFinite(result) ? 0 : Math.round(result * 100) / 100;
  } catch (err) {
    console.error(`[PayrollEngine] Error evaluating formula "${formulaStr}":`, err.message);
>>>>>>> feature/backend
    return 0;
  }
}

/**
<<<<<<< HEAD
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
=======
 * Calculates working schedule days and attendance summary for an employee across a period.
 */
async function calculateAttendanceMetrics(employeeId, workingScheduleId, periodStart, periodEnd) {
  // Count total calendar days and determine scheduled working days
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Default standard 22 working days in a month if schedule not customized
  let scheduledWorkingDays = 22;
  
  if (workingScheduleId) {
    const days = await query(
      'SELECT day_of_week FROM schedule_days WHERE schedule_id = ?',
      [workingScheduleId]
    );
    if (days && days.length > 0) {
      const scheduleDaysSet = new Set(days.map(d => d.day_of_week.toLowerCase()));
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      let count = 0;
      const curr = new Date(start);
      while (curr <= end) {
        const dayName = dayNames[curr.getDay()];
        if (scheduleDaysSet.has(dayName)) {
          count++;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (count > 0) {
        scheduledWorkingDays = count;
      }
    }
  }

  // Actual attendance records logged
  const attendanceRecords = await query(
    `SELECT COUNT(*) AS attended_days,
            SUM(CASE WHEN status = 'Half Day' THEN 0.5 ELSE 1.0 END) AS worked_days_calculated
     FROM attendance
     WHERE employee_id = ? 
       AND date >= ? 
       AND date <= ?
       AND status IN ('Present', 'Half Day', 'Late')`,
    [employeeId, periodStart, periodEnd]
  );

  const rawAttendedDays = Number(attendanceRecords[0]?.worked_days_calculated || 0);

  // Approved paid time off in this period
  const leaveRecords = await query(
    `SELECT SUM(days_requested) AS approved_leave_days
     FROM time_off_requests tor
     JOIN time_off_types tot ON tor.time_off_type_id = tot.id
     WHERE tor.employee_id = ?
       AND tor.status = 'Approved'
       AND tor.start_date <= ?
       AND tor.end_date >= ?`,
    [employeeId, periodEnd, periodStart]
  );

  const approvedLeaveDays = Number(leaveRecords[0]?.approved_leave_days || 0);

  // If no attendance records are logged at all in demo, assume full attendance minus approved leave
  // But if attendance records exist, use actual attendance + approved leave
  let payableDays = 0;
  let absentDays = 0;
  let workedDays = rawAttendedDays;

  if (rawAttendedDays === 0) {
    // Full month default for demo convenience if attendance table wasn't populated for this employee
    workedDays = Math.max(0, scheduledWorkingDays - approvedLeaveDays);
    payableDays = scheduledWorkingDays;
    absentDays = 0;
  } else {
    payableDays = Math.min(scheduledWorkingDays, rawAttendedDays + approvedLeaveDays);
    absentDays = Math.max(0, scheduledWorkingDays - payableDays);
  }

  const attendanceFactor = scheduledWorkingDays > 0 ? (payableDays / scheduledWorkingDays) : 1.0;

  return {
    scheduledDays: scheduledWorkingDays,
    workedDays,
    leaveDays: approvedLeaveDays,
    absentDays,
    attendanceFactor: Math.min(1.0, Math.max(0.0, attendanceFactor))
>>>>>>> feature/backend
  };
}

/**
<<<<<<< HEAD
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
=======
 * Computes the salary for an employee for a specific payrun period.
 * Executes all rules of the structure in sequence.
 */
async function computeEmployeePayroll(employeeId, periodStart, periodEnd, salaryStructureId = null) {
  // 1. Find the applicable contract for the period
  const contract = await findApplicableContract(employeeId, periodStart, periodEnd);
  if (!contract) {
    throw new Error(`No applicable contract found for employee ID ${employeeId} in period ${periodStart} to ${periodEnd}.`);
  }

  const structureId = salaryStructureId || contract.salary_structure_id;

  // 2. Fetch all active salary rules associated with the salary structure, ordered by sequence
  const rules = await query(
    `SELECT sr.* 
     FROM salary_rules sr
     JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
     WHERE ssr.salary_structure_id = ? AND sr.is_active = TRUE
     ORDER BY sr.sequence ASC`,
    [structureId]
  );

  if (!rules || rules.length === 0) {
    throw new Error(`Salary structure ${structureId} has no active rules configured.`);
  }

  // 3. Compute attendance metrics
  const attendanceMetrics = await calculateAttendanceMetrics(
    employeeId,
    contract.working_schedule_id,
    periodStart,
    periodEnd
  );

  const monthlyWage = Number(contract.wage);
  const factor = attendanceMetrics.attendanceFactor;

  // 4. Initialize calculation scope
  const scope = {
    WAGE: monthlyWage,
    ATTENDANCE_FACTOR: factor,
    SCHEDULED_DAYS: attendanceMetrics.scheduledDays,
    WORKED_DAYS: attendanceMetrics.workedDays,
    LEAVE_DAYS: attendanceMetrics.leaveDays,
    ABSENT_DAYS: attendanceMetrics.absentDays
>>>>>>> feature/backend
  };

  const payslipLines = [];
  let grossSalary = 0;
  let totalDeductions = 0;
<<<<<<< HEAD
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
=======

  // 5. Evaluate rules in strict sequence
  for (const rule of rules) {
    let amount = 0;
    const rate = Number(rule.rate_or_amount || 0);

    switch (rule.calc_type) {
      case 'fixed':
        // For fixed allowances, pro-rate by attendance factor
        if (rule.category === 'Allowance') {
          amount = rate * factor;
        } else {
          amount = rate;
        }
        break;

      case 'percent_wage':
        if (rule.category === 'Basic' || rule.category === 'Allowance') {
          amount = monthlyWage * rate * factor;
        } else {
          amount = monthlyWage * rate;
        }
        break;

      case 'percent_basic': {
        const basicVal = scope['BASIC'] || (monthlyWage * 0.5 * factor);
        // Provident Fund cap rule (e.g. 12% of Basic up to max 15000 basic)
        if (rule.code === 'PF') {
          amount = Math.min(basicVal, 15000) * rate;
        } else {
          amount = basicVal * rate;
        }
        break;
      }

      case 'formula':
        amount = evaluateFormula(rule.formula, scope);
        break;

      default:
        amount = 0;
    }

    amount = Math.round(amount * 100) / 100;

    // Put calculated value in scope so subsequent rules in sequence can use it
    scope[rule.code] = amount;

    if (rule.category === 'Gross') {
      grossSalary = amount;
    } else if (rule.category === 'Deduction') {
      totalDeductions += amount;
>>>>>>> feature/backend
    }

    payslipLines.push({
      rule_id: rule.id,
<<<<<<< HEAD
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
=======
      code: rule.code,
      name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount
    });
  }

  // Fallback / sanity reconciliation for Gross, Deductions, and Net
  if (!scope['GROSS'] || grossSalary === 0) {
    grossSalary = payslipLines
      .filter(l => l.category === 'Basic' || l.category === 'Allowance')
      .reduce((sum, l) => sum + l.amount, 0);
  }

  if (totalDeductions === 0) {
    totalDeductions = payslipLines
      .filter(l => l.category === 'Deduction')
      .reduce((sum, l) => sum + l.amount, 0);
  }

  const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;
  scope['NET'] = netSalary;

  // Ensure NET line exists in payslipLines with correct netSalary
  const netIndex = payslipLines.findIndex(l => l.code === 'NET');
  if (netIndex !== -1) {
    payslipLines[netIndex].amount = netSalary;
  } else {
    payslipLines.push({
      rule_id: null,
      code: 'NET',
      name: 'Net Salary',
      category: 'Net',
      sequence: 99,
      amount: netSalary
    });
>>>>>>> feature/backend
  }

  return {
    contract,
<<<<<<< HEAD
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
=======
    salaryStructureId: structureId,
    periodStart,
    periodEnd,
    scheduledDays: attendanceMetrics.scheduledDays,
    workedDays: attendanceMetrics.workedDays,
    leaveDays: attendanceMetrics.leaveDays,
    absentDays: attendanceMetrics.absentDays,
    grossSalary: Math.round(grossSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary,
    lines: payslipLines,
    scope
>>>>>>> feature/backend
  };
}

module.exports = {
<<<<<<< HEAD
  getApplicableContract,
  getPeriodAttendanceAndLeaves,
  computeEmployeePayslip,
=======
  computeEmployeePayroll,
  calculateAttendanceMetrics,
>>>>>>> feature/backend
  evaluateFormula
};
