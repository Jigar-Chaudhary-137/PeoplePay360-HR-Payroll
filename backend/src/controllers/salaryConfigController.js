const { query, withTransaction } = require('../config/db');

// List Salary Structures with their linked rules
async function getSalaryStructures(req, res) {
  const structures = await query('SELECT * FROM salary_structures ORDER BY id ASC');

  for (const s of structures) {
    const rules = await query(
      `SELECT sr.*, COALESCE(ssr.sequence_override, sr.sequence) as effective_sequence
       FROM salary_rules sr
       JOIN salary_structure_rules ssr ON sr.id = ssr.rule_id
       WHERE ssr.structure_id = ?
       ORDER BY effective_sequence ASC`,
      [s.id]
    );
    s.rules = rules;

    // Count active contracts using this structure
    const [cntRes] = await query('SELECT COUNT(*) as count FROM contracts WHERE salary_structure_id = ?', [s.id]);
    s.contract_count = cntRes[0]?.count || 0;
  }

  return res.json({ success: true, count: structures.length, data: structures });
}

// Get single Salary Structure
async function getSalaryStructureById(req, res) {
  const { id } = req.params;
  const structures = await query('SELECT * FROM salary_structures WHERE id = ?', [id]);

  if (structures.length === 0) {
    return res.status(404).json({ success: false, message: 'Salary structure not found.' });
  }

  const structure = structures[0];
  structure.rules = await query(
    `SELECT sr.*, COALESCE(ssr.sequence_override, sr.sequence) as effective_sequence
     FROM salary_rules sr
     JOIN salary_structure_rules ssr ON sr.id = ssr.rule_id
     WHERE ssr.structure_id = ?
     ORDER BY effective_sequence ASC`,
    [id]
  );

  return res.json({ success: true, data: structure });
}

// Create Salary Structure
async function createSalaryStructure(req, res) {
  const { name, code, description, rule_ids } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Structure name and code are required.' });
  }

  const structId = await withTransaction(async (conn) => {
    const [insertRes] = await conn.query(
      `INSERT INTO salary_structures (name, code, description, is_active)
       VALUES (?, ?, ?, TRUE)`,
      [name, code.trim().toUpperCase(), description || null]
    );

    const insertedId = insertRes.insertId;

    if (Array.isArray(rule_ids)) {
      for (const rId of rule_ids) {
        await conn.query(
          `INSERT INTO salary_structure_rules (structure_id, rule_id) VALUES (?, ?)`,
          [insertedId, rId]
        );
      }
    }

    return insertedId;
  });

  return res.status(201).json({
    success: true,
    message: `Salary structure "${name}" created successfully.`,
    structure_id: structId
  });
}

// List all Salary Rules
async function getSalaryRules(req, res) {
  const rules = await query('SELECT * FROM salary_rules ORDER BY sequence ASC');
  return res.json({ success: true, count: rules.length, data: rules });
}

// Create Salary Rule
async function createSalaryRule(req, res) {
  const {
    name, code, category, sequence, calculation_type,
    percentage, component_code, fixed_amount, formula_expression, structure_id
  } = req.body;

  if (!name || !code || !category || !calculation_type) {
    return res.status(400).json({ success: false, message: 'Name, code, category, and calculation type are required.' });
  }

  const ruleId = await withTransaction(async (conn) => {
    const [resInsert] = await conn.query(
      `INSERT INTO salary_rules (
        name, code, category, sequence, calculation_type,
        percentage, component_code, fixed_amount, formula_expression, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        name, code.trim().toUpperCase(), category, sequence || 10, calculation_type,
        percentage || 0, component_code || null, fixed_amount || 0, formula_expression || null
      ]
    );

    const insertedRuleId = resInsert.insertId;

    if (structure_id) {
      await conn.query(
        `INSERT INTO salary_structure_rules (structure_id, rule_id, sequence_override)
         VALUES (?, ?, ?)`,
        [structure_id, insertedRuleId, sequence || 10]
      );
    }

    return insertedRuleId;
  });

  return res.status(201).json({
    success: true,
    message: `Salary rule "${name}" (${code}) created successfully.`,
    rule_id: ruleId
  });
}

// Update Salary Rule
async function updateSalaryRule(req, res) {
  const { id } = req.params;
  const {
    name, category, sequence, calculation_type,
    percentage, component_code, fixed_amount, formula_expression, is_active
  } = req.body;

  await query(
    `UPDATE salary_rules SET
       name = ?, category = ?, sequence = ?, calculation_type = ?,
       percentage = ?, component_code = ?, fixed_amount = ?,
       formula_expression = ?, is_active = ?
     WHERE id = ?`,
    [
      name, category, sequence, calculation_type,
      percentage || 0, component_code || null, fixed_amount || 0,
      formula_expression || null, is_active !== undefined ? is_active : true, id
    ]
  );

  return res.json({ success: true, message: 'Salary rule updated successfully.' });
}

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule
};
