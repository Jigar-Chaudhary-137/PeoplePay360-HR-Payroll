const { query } = require('../config/db');

// List contracts
async function getContracts(req, res) {
  const { employee_id, status } = req.query;

  let sql = `
    SELECT c.*,
           e.emp_code, e.first_name, e.last_name, e.email,
           d.name as department_name,
           jp.title as job_title,
           s.name as structure_name,
           ws.name as schedule_name
    FROM contracts c
    JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN job_positions jp ON c.job_position_id = jp.id
    JOIN salary_structures s ON c.salary_structure_id = s.id
    LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
    WHERE 1=1
  `;
  const params = [];

  if (employee_id) {
    sql += ` AND c.employee_id = ?`;
    params.push(employee_id);
  }

  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY c.start_date DESC`;

  const contracts = await query(sql, params);
  return res.json({ success: true, count: contracts.length, data: contracts });
}

// Get contract by ID
async function getContractById(req, res) {
  const { id } = req.params;
  const contracts = await query(
    `SELECT c.*,
            e.emp_code, e.first_name, e.last_name, e.email,
            d.name as department_name,
            jp.title as job_title,
            s.name as structure_name,
            ws.name as schedule_name
     FROM contracts c
     JOIN employees e ON c.employee_id = e.id
     LEFT JOIN departments d ON c.department_id = d.id
     LEFT JOIN job_positions jp ON c.job_position_id = jp.id
     JOIN salary_structures s ON c.salary_structure_id = s.id
     LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
     WHERE c.id = ?`,
    [id]
  );

  if (contracts.length === 0) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  return res.json({ success: true, data: contracts[0] });
}

// Create new contract
async function createContract(req, res) {
  const {
    employee_id, start_date, end_date, department_id, job_position_id,
    wage, working_schedule_id, salary_structure_id, status, notes
  } = req.body;

  if (!employee_id || !start_date || !wage || !salary_structure_id) {
    return res.status(400).json({
      success: false,
      message: 'Employee, start date, wage, and salary structure are required.'
    });
  }

  // Check for conflicting running contracts
  if (status === 'running') {
    const conflicts = await query(
      `SELECT id, contract_code, start_date, end_date FROM contracts
       WHERE employee_id = ? AND status = 'running'
         AND (
           (? BETWEEN start_date AND COALESCE(end_date, '9999-12-31'))
           OR (? IS NOT NULL AND ? BETWEEN start_date AND COALESCE(end_date, '9999-12-31'))
         )`,
      [employee_id, start_date, end_date, end_date]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Conflict with active contract ${conflicts[0].contract_code}. Please expire or adjust old contracts before adding a running one.`
      });
    }
  }

  // Generate contract code: CNT-YYYY-XXX
  const year = new Date(start_date).getFullYear();
  const [countRes] = await query('SELECT COUNT(*) as count FROM contracts');
  const code = `CNT-${year}-${String((countRes[0]?.count || 0) + 1).padStart(3, '0')}`;

  const [resInsert] = await query(
    `INSERT INTO contracts (
      contract_code, employee_id, start_date, end_date, department_id,
      job_position_id, wage, working_schedule_id, salary_structure_id, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code, employee_id, start_date, end_date || null, department_id || null,
      job_position_id || null, wage, working_schedule_id || null, salary_structure_id,
      status || 'running', notes || null
    ]
  );

  return res.status(201).json({
    success: true,
    message: `Contract ${code} created successfully.`,
    contract_id: resInsert.insertId,
    contract_code: code
  });
}

// Update contract
async function updateContract(req, res) {
  const { id } = req.params;
  const {
    start_date, end_date, department_id, job_position_id,
    wage, working_schedule_id, salary_structure_id, status, notes
  } = req.body;

  await query(
    `UPDATE contracts SET
       start_date = ?, end_date = ?, department_id = ?, job_position_id = ?,
       wage = ?, working_schedule_id = ?, salary_structure_id = ?, status = ?, notes = ?
     WHERE id = ?`,
    [
      start_date, end_date || null, department_id || null, job_position_id || null,
      wage, working_schedule_id || null, salary_structure_id, status, notes || null, id
    ]
  );

  return res.json({ success: true, message: 'Contract updated successfully.' });
}

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract
};
