const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

function normalizeCategory(cat) {
  if (!cat) return 'Allowance';
  const c = String(cat).toLowerCase();
  if (c.includes('basic')) return 'Basic';
  if (c.includes('allowance')) return 'Allowance';
  if (c.includes('gross')) return 'Gross';
  if (c.includes('deduction')) return 'Deduction';
  if (c.includes('net')) return 'Net';
  return 'Allowance';
}

function normalizeCalcType(t) {
  if (!t) return 'fixed';
  const val = String(t).toLowerCase();
  if (val.includes('percent_basic')) return 'percent_basic';
  if (val.includes('percent_wage')) return 'percent_wage';
  if (val.includes('formula')) return 'formula';
  if (val.includes('fixed')) return 'fixed';
  return 'fixed';
}

function formatRule(sr) {
  if (!sr) return sr;
  return {
    ...sr,
    calculation_type: (sr.calc_type || '').toUpperCase(),
    percentage: sr.calc_type && sr.calc_type.startsWith('percent') ? Number(sr.rate_or_amount) : 0,
    fixed_amount: sr.calc_type === 'fixed' ? Number(sr.rate_or_amount) : 0,
    formula_expression: sr.formula || ''
  };
}

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
    return res.json({ success: true, data: rules.map(formatRule) });
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
      calculation_type,
      rate_or_amount,
      percentage,
      fixed_amount,
      formula,
      formula_expression
    } = req.body;

    const finalCategory = normalizeCategory(category);
    const finalCalcType = normalizeCalcType(calc_type || calculation_type);
    const finalRate = rate_or_amount !== undefined 
      ? Number(rate_or_amount) 
      : (finalCalcType === 'fixed' ? Number(fixed_amount || 0) : Number(percentage || 0));
    const finalFormula = formula || formula_expression || null;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and unique rule code are required.'
      });
    }

    const result = await query(
      `INSERT INTO salary_rules (name, code, category, sequence, calc_type, rate_or_amount, formula, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [name, code.toUpperCase(), finalCategory, sequence, finalCalcType, finalRate, finalFormula]
    );

    await logAudit(req.user?.id, 'CREATE_SALARY_RULE', 'salary_rule', result.insertId, { code, category: finalCategory, sequence });

    const [created] = await query('SELECT * FROM salary_rules WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, data: formatRule(created) });
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
      calculation_type,
      rate_or_amount,
      percentage,
      fixed_amount,
      formula,
      formula_expression,
      is_active
    } = req.body;

    const [existing] = await query('SELECT * FROM salary_rules WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Salary rule ${id} not found.` });
    }

    const finalCategory = category ? normalizeCategory(category) : existing.category;
    const finalCalcType = (calc_type || calculation_type) ? normalizeCalcType(calc_type || calculation_type) : existing.calc_type;
    let finalRate = existing.rate_or_amount;
    if (rate_or_amount !== undefined) {
      finalRate = Number(rate_or_amount);
    } else if (finalCalcType === 'fixed' && fixed_amount !== undefined) {
      finalRate = Number(fixed_amount);
    } else if (percentage !== undefined) {
      finalRate = Number(percentage);
    }
    const finalFormula = formula !== undefined ? formula : (formula_expression !== undefined ? formula_expression : existing.formula);

    await query(
      `UPDATE salary_rules SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        sequence = COALESCE(?, sequence),
        calc_type = COALESCE(?, calc_type),
        rate_or_amount = COALESCE(?, rate_or_amount),
        formula = ?,
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name || null, finalCategory, sequence || null, finalCalcType, finalRate, finalFormula || null, is_active !== undefined ? is_active : null, id]
    );

    await logAudit(req.user?.id, 'UPDATE_SALARY_RULE', 'salary_rule', id, req.body);

    const [updated] = await query('SELECT * FROM salary_rules WHERE id = ?', [id]);
    return res.json({ success: true, data: formatRule(updated) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule
};
