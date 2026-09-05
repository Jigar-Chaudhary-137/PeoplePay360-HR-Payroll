const { query } = require('../config/db');

async function getDepartments(req, res, next) {
  try {
    const departments = await query(
      `SELECT d.*, 
              COUNT(DISTINCT e.id) AS total_employees,
              m.first_name AS manager_first_name,
              m.last_name AS manager_last_name
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id
       LEFT JOIN employees m ON d.manager_id = m.id
       GROUP BY d.id
       ORDER BY d.name ASC`
    );

    for (const d of departments) {
      d.positions = await query(
        'SELECT * FROM job_positions WHERE department_id = ? ORDER BY title ASC',
        [d.id]
      );
    }

    return res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, manager_id } = req.body;
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and unique code are required.'
      });
    }

    const result = await query(
      'INSERT INTO departments (name, code, manager_id) VALUES (?, ?, ?)',
      [name, code.toUpperCase(), manager_id || null]
    );

    const [created] = await query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    next(error);
  }
}

async function getJobPositions(req, res, next) {
  try {
    const { department_id } = req.query;
    let sql = `
      SELECT jp.*, d.name AS department_name
      FROM job_positions jp
      JOIN departments d ON jp.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND jp.department_id = ?';
      params.push(department_id);
    }

    sql += ' ORDER BY jp.title ASC';
    const positions = await query(sql, params);

    return res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDepartments,
  createDepartment,
  getJobPositions
};
