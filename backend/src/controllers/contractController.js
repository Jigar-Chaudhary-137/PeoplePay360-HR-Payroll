const { query } = require('../config/db');
const { findApplicableContract, validateContractOverlap } = require('../services/contractService');
const { logAudit } = require('../utils/auditLogger');

async function getContracts(req, res, next) {
  try {
    const { employee_id, status } = req.query;
    let sql = `
      SELECT c.*,
             e.first_name, e.last_name, e.employee_code,
             ss.name AS salary_structure_name,
             ws.name AS working_schedule_name,
             d.name AS department_name,
             jp.title AS job_position_title
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      JOIN salary_structures ss ON c.salary_structure_id = ss.id
      LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN job_positions jp ON c.job_position_id = jp.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND c.employee_id = ?';
      params.push(employee_id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.start_date DESC';

    const contracts = await query(sql, params);
    return res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    next(error);
  }
}

async function getContractById(req, res, next) {
  try {
    const { id } = req.params;
    const contracts = await query(
      `SELECT c.*,
              e.first_name, e.last_name, e.employee_code,
              ss.name AS salary_structure_name,
              ws.name AS working_schedule_name,
              d.name AS department_name,
              jp.title AS job_position_title
       FROM contracts c
       JOIN employees e ON c.employee_id = e.id
       JOIN salary_structures ss ON c.salary_structure_id = ss.id
       LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN job_positions jp ON c.job_position_id = jp.id
       WHERE c.id = ?`,
      [id]
    );

    if (!contracts || contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Contract with ID ${id} not found.`
      });
    }

    return res.json({
      success: true,
      data: contracts[0]
    });
  } catch (error) {
    next(error);
  }
}

async function getApplicableContract(req, res, next) {
  try {
    const { employee_id, period_start, period_end } = req.query;
    if (!employee_id || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'employee_id, period_start, and period_end are required.'
      });
    }

    const contract = await findApplicableContract(employee_id, period_start, period_end);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: `No active contract found for employee ${employee_id} during period ${period_start} to ${period_end}.`
      });
    }

    return res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
}

async function createContract(req, res, next) {
  try {
    const {
      contract_code,
      employee_id,
      start_date,
      end_date,
      department_id,
      job_position_id,
      wage,
      working_schedule_id,
      salary_structure_id,
      status = 'Running',
      notes
    } = req.body;

    if (!employee_id || !start_date || !wage || !salary_structure_id) {
      return res.status(400).json({
        success: false,
        message: 'employee_id, start_date, wage, and salary_structure_id are required.'
      });
    }

    // Check for invalid date overlap with existing contracts
    const conflicts = await validateContractOverlap(employee_id, start_date, end_date || null);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Conflict detected: this contract overlaps with existing contract ${conflicts[0].contract_code} (${conflicts[0].start_date} to ${conflicts[0].end_date || 'ongoing'}).`
      });
    }

    const code = contract_code || `CON-${Date.now().toString().slice(-6)}`;

    const result = await query(
      `INSERT INTO contracts (
        contract_code, employee_id, start_date, end_date,
        department_id, job_position_id, wage,
        working_schedule_id, salary_structure_id, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, employee_id, start_date, end_date || null,
        department_id || null, job_position_id || null, wage,
        working_schedule_id || 1, salary_structure_id, status, notes || null
      ]
    );

    await logAudit(req.user?.id, 'CREATE_CONTRACT', 'contract', result.insertId, { code, wage, employee_id });

    const [created] = await query('SELECT * FROM contracts WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      success: true,
      message: 'Contract created successfully.',
      data: created
    });
  } catch (error) {
    next(error);
  }
}

async function updateContract(req, res, next) {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      department_id,
      job_position_id,
      wage,
      working_schedule_id,
      salary_structure_id,
      status,
      notes
    } = req.body;

    const [existing] = await query('SELECT * FROM contracts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Contract with ID ${id} not found.`
      });
    }

    if (start_date) {
      const conflicts = await validateContractOverlap(
        existing.employee_id,
        start_date,
        end_date !== undefined ? end_date : existing.end_date,
        id
      );
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Conflict: dates overlap with contract ${conflicts[0].contract_code}.`
        });
      }
    }

    await query(
      `UPDATE contracts SET
        start_date = COALESCE(?, start_date),
        end_date = ?,
        department_id = COALESCE(?, department_id),
        job_position_id = COALESCE(?, job_position_id),
        wage = COALESCE(?, wage),
        working_schedule_id = COALESCE(?, working_schedule_id),
        salary_structure_id = COALESCE(?, salary_structure_id),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        start_date, end_date !== undefined ? end_date : existing.end_date,
        department_id, job_position_id, wage, working_schedule_id,
        salary_structure_id, status, notes, id
      ]
    );

    await logAudit(req.user?.id, 'UPDATE_CONTRACT', 'contract', id, req.body);

    const [updated] = await query('SELECT * FROM contracts WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Contract updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getContracts,
  getContractById,
  getApplicableContract,
  createContract,
  updateContract
};
