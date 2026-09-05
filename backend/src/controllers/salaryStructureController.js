const { query, getTransactionConnection } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getSalaryStructures(req, res, next) {
  try {
    const structures = await query(
      `SELECT ss.*, COUNT(ssr.salary_rule_id) AS rule_count
       FROM salary_structures ss
       LEFT JOIN salary_structure_rules ssr ON ss.id = ssr.salary_structure_id
       GROUP BY ss.id
       ORDER BY ss.id ASC`
    );

    for (const s of structures) {
      s.rules = await query(
        `SELECT sr.* 
         FROM salary_rules sr
         JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
         WHERE ssr.salary_structure_id = ?
         ORDER BY sr.sequence ASC`,
        [s.id]
      );
    }

    return res.json({ success: true, data: structures });
  } catch (error) {
    next(error);
  }
}

async function getSalaryStructureById(req, res, next) {
  try {
    const { id } = req.params;
    const [structure] = await query('SELECT * FROM salary_structures WHERE id = ?', [id]);
    if (!structure) {
      return res.status(404).json({ success: false, message: `Salary structure ${id} not found.` });
    }

    structure.rules = await query(
      `SELECT sr.* 
       FROM salary_rules sr
       JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
       WHERE ssr.salary_structure_id = ?
       ORDER BY sr.sequence ASC`,
      [id]
    );

    return res.json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
}

async function createSalaryStructure(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { name, description, rule_ids = [] } = req.body;
    if (!name) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Structure name is required.' });
    }

    const [result] = await conn.query(
      'INSERT INTO salary_structures (name, description, is_active) VALUES (?, ?, TRUE)',
      [name, description || null]
    );
    const newId = result.insertId;

    for (const ruleId of rule_ids) {
      await conn.query(
        'INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id) VALUES (?, ?)',
        [newId, ruleId]
      );
    }

    await conn.commit();
    await logAudit(req.user?.id, 'CREATE_SALARY_STRUCTURE', 'salary_structure', newId, { name, rules: rule_ids });

    const [created] = await query('SELECT * FROM salary_structures WHERE id = ?', [newId]);
    created.rules = await query(
      `SELECT sr.* FROM salary_rules sr
       JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
       WHERE ssr.salary_structure_id = ? ORDER BY sr.sequence ASC`,
      [newId]
    );

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

async function updateSalaryStructure(req, res, next) {
  const conn = await getTransactionConnection();
  try {
    const { id } = req.params;
    const { name, description, is_active, rule_ids } = req.body;

    await conn.query(
      `UPDATE salary_structures SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, is_active, id]
    );

    if (Array.isArray(rule_ids)) {
      await conn.query('DELETE FROM salary_structure_rules WHERE salary_structure_id = ?', [id]);
      for (const ruleId of rule_ids) {
        await conn.query(
          'INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id) VALUES (?, ?)',
          [id, ruleId]
        );
      }
    }

    await conn.commit();
    await logAudit(req.user?.id, 'UPDATE_SALARY_STRUCTURE', 'salary_structure', id, req.body);

    const [updated] = await query('SELECT * FROM salary_structures WHERE id = ?', [id]);
    updated.rules = await query(
      `SELECT sr.* FROM salary_rules sr
       JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
       WHERE ssr.salary_structure_id = ? ORDER BY sr.sequence ASC`,
      [id]
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure
};
