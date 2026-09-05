const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getSalaryRules(req, res, next) {
  try {
    const rules = await query(
      `SELECT sr.*, 
              COUNT(ssr.salary_structure_id) AS structures_count
       FROM salary_rules sr
       LEFT JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
       GROUP BY sr.id
       ORDER BY sr.sequence ASC`
    );
    return res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
}

async function createSalaryRule(req, res, next) {
  try {
    const {
      name,
      code,
      category,
      sequence = 1,
      calc_type,
      rate_or_amount = 0.00,
      formula
    } = req.body;

    if (!name || !code || !category || !calc_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, category (Basic/Allowance/Gross/Deduction/Net), and calc_type are required.'
      });
    }

    const result = await query(
      `INSERT INTO salary_rules (name, code, category, sequence, calc_type, rate_or_amount, formula, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [name, code.toUpperCase(), category, sequence, calc_type, rate_or_amount, formula || null]
    );

    await logAudit(req.user?.id, 'CREATE_SALARY_RULE', 'salary_rule', result.insertId, { code, category, sequence });

    const [created] = await query('SELECT * FROM salary_rules WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A salary rule with this code already exists.' });
    }
    next(error);
  }
}

async function updateSalaryRule(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      sequence,
      calc_type,
      rate_or_amount,
      formula,
      is_active
    } = req.body;

    await query(
      `UPDATE salary_rules SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        sequence = COALESCE(?, sequence),
        calc_type = COALESCE(?, calc_type),
        rate_or_amount = COALESCE(?, rate_or_amount),
        formula = COALESCE(?, formula),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, category, sequence, calc_type, rate_or_amount, formula, is_active, id]
    );

    await logAudit(req.user?.id, 'UPDATE_SALARY_RULE', 'salary_rule', id, req.body);

    const [updated] = await query('SELECT * FROM salary_rules WHERE id = ?', [id]);
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule
};
