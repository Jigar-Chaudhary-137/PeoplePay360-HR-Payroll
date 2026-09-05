const { query } = require('../config/db');

/**
 * Finds the contract applicable to a specific payroll period.
 * 
 * Rules:
 * 1. Contract start_date must be <= periodEnd
 * 2. Contract end_date must be NULL (ongoing) OR >= periodStart
 * 3. Contract status should be 'Running' or 'Expired' (if expired after the period)
 * 4. In case multiple contracts exist, picks the one with the closest start_date to the period
 */
async function findApplicableContract(employeeId, periodStart, periodEnd) {
  const sql = `
    SELECT c.*, 
           ss.name AS salary_structure_name,
           ws.name AS working_schedule_name,
           d.name AS department_name,
           jp.title AS job_position_title
    FROM contracts c
    JOIN salary_structures ss ON c.salary_structure_id = ss.id
    LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN job_positions jp ON c.job_position_id = jp.id
    WHERE c.employee_id = ?
      AND c.start_date <= ?
      AND (c.end_date IS NULL OR c.end_date >= ?)
      AND c.status IN ('Running', 'Expired')
    ORDER BY c.start_date DESC
    LIMIT 1
  `;

  const contracts = await query(sql, [employeeId, periodEnd, periodStart]);
  return contracts.length > 0 ? contracts[0] : null;
}

/**
 * Validates whether adding/updating a contract creates an illegal date overlap
 */
async function validateContractOverlap(employeeId, startDate, endDate, excludeContractId = null) {
  let sql = `
    SELECT id, contract_code, start_date, end_date, wage
    FROM contracts
    WHERE employee_id = ?
      AND status != 'Terminated'
      AND (
        (? <= IFNULL(end_date, '9999-12-31')) AND
        (IFNULL(?, '9999-12-31') >= start_date)
      )
  `;
  const params = [employeeId, startDate, endDate];

  if (excludeContractId) {
    sql += ' AND id != ?';
    params.push(excludeContractId);
  }

  const conflicts = await query(sql, params);
  return conflicts;
}

module.exports = {
  findApplicableContract,
  validateContractOverlap
};
