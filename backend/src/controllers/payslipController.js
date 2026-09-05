const { query } = require('../config/db');
const { generatePayslipPDF } = require('../services/pdfService');
<<<<<<< HEAD
const { sendPayslipEmail, sendBulkPayrunEmails } = require('../services/emailService');

// List Payslips
async function getPayslips(req, res) {
  const { employee_id, payrun_id, period_month, status } = req.query;

  let sql = `
    SELECT p.*,
           e.emp_code, e.first_name, e.last_name, e.email,
           d.name as department_name,
           jp.title as job_title,
           pr.name as payrun_name
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN job_positions jp ON e.job_position_id = jp.id
    JOIN payruns pr ON p.payrun_id = pr.id
    WHERE 1=1
  `;
  const params = [];

  // Employee role can only access their own payslips
  if (req.user.role === 'Employee') {
    sql += ` AND p.employee_id = ?`;
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ` AND p.employee_id = ?`;
    params.push(employee_id);
  }

  if (payrun_id) {
    sql += ` AND p.payrun_id = ?`;
    params.push(payrun_id);
  }

  if (period_month) {
    sql += ` AND p.period_month = ?`;
    params.push(period_month);
  }

  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY p.period_month DESC, e.emp_code ASC`;

  const payslips = await query(sql, params);
  return res.json({ success: true, count: payslips.length, data: payslips });
}

// Get single Payslip with itemized breakdown lines
async function getPayslipById(req, res) {
  const { id } = req.params;

  const payslips = await query(
    `SELECT p.*,
            e.emp_code, e.first_name, e.last_name, e.email, e.phone, e.pan_number,
            e.bank_name, e.bank_account_no, e.bank_ifsc, e.joining_date,
            d.name as department_name, jp.title as job_title,
            s.name as structure_name, pr.name as payrun_name,
            c.contract_code, c.wage as contract_wage
     FROM payslips p
     JOIN employees e ON p.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     JOIN salary_structures s ON p.salary_structure_id = s.id
     JOIN payruns pr ON p.payrun_id = pr.id
     JOIN contracts c ON p.contract_id = c.id
     WHERE p.id = ?`,
    [id]
  );

  if (payslips.length === 0) {
    return res.status(404).json({ success: false, message: 'Payslip not found.' });
  }

  const ps = payslips[0];

  // Restrict Employee role to own payslip
  if (req.user.role === 'Employee' && req.user.employee_id !== ps.employee_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this payslip.' });
  }

  // Load itemized calculation lines
  const lines = await query(
    `SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC`,
    [id]
  );

  const earnings = lines.filter(l => l.category === 'BASIC' || l.category === 'ALLOWANCE');
  const deductions = lines.filter(l => l.category === 'DEDUCTION');

  return res.json({
    success: true,
    data: {
      ...ps,
      lines,
      earnings,
      deductions
    }
  });
}

// Download PDF
async function downloadPayslipPDF(req, res) {
  const { id } = req.params;

  const [ps] = await query('SELECT employee_id, payslip_code, period_month FROM payslips WHERE id = ?', [id]);
  if (!ps) {
    return res.status(404).json({ success: false, message: 'Payslip not found.' });
  }

  // Restrict Employee role to own payslip
  if (req.user.role === 'Employee' && req.user.employee_id !== ps.employee_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to download this payslip.' });
  }

  try {
    const pdfBuffer = await generatePayslipPDF(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${ps.payslip_code}_${ps.period_month}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[PayslipController] PDF generation failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payslip PDF.' });
  }
}

// Send Single Email
async function emailPayslip(req, res) {
  const { id } = req.params;

  try {
    const result = await sendPayslipEmail(id);
    return res.json({
      success: true,
      message: `Payslip email dispatched successfully to ${result.recipientEmail}`,
      details: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Bulk Send Emails for Payrun
async function emailBulkPayrun(req, res) {
  const { payrun_id } = req.body;
  if (!payrun_id) {
    return res.status(400).json({ success: false, message: 'Payrun ID is required.' });
  }

  try {
    const result = await sendBulkPayrunEmails(payrun_id);
    return res.json({
      success: true,
      message: `Dispatched ${result.sent} of ${result.total} payslip emails.`,
      summary: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
=======
const { sendPayslipEmail } = require('../services/emailService');
const { logAudit } = require('../utils/auditLogger');

async function getPayslips(req, res, next) {
  try {
    const { payrun_id, employee_id, status } = req.query;
    let sql = `
      SELECT ps.*,
             e.first_name, e.last_name, e.employee_code, e.email AS employee_email,
             d.name AS department_name, jp.title AS job_position_title,
             pr.name AS payrun_name
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN payruns pr ON ps.payrun_id = pr.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      WHERE 1=1
    `;
    const params = [];

    // If regular Employee role, restrict to own payslips
    if (req.user.role === 'Employee' && req.user.employee_id) {
      sql += ' AND ps.employee_id = ?';
      params.push(req.user.employee_id);
    } else if (employee_id) {
      sql += ' AND ps.employee_id = ?';
      params.push(employee_id);
    }

    if (payrun_id) {
      sql += ' AND ps.payrun_id = ?';
      params.push(payrun_id);
    }

    if (status) {
      sql += ' AND ps.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ps.period_start DESC, e.first_name ASC';

    const payslips = await query(sql, params);
    return res.json({ success: true, data: payslips });
  } catch (error) {
    next(error);
  }
}

async function getPayslipById(req, res, next) {
  try {
    const { id } = req.params;

    const [payslip] = await query(
      `SELECT ps.*,
              e.first_name, e.last_name, e.employee_code, e.email AS employee_email,
              e.bank_name, e.bank_account_no, e.bank_ifsc, e.pan_no,
              d.name AS department_name, jp.title AS job_position_title,
              c.contract_code, c.wage AS contract_wage,
              ss.name AS salary_structure_name,
              pr.name AS payrun_name
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       JOIN contracts c ON ps.contract_id = c.id
       JOIN salary_structures ss ON ps.salary_structure_id = ss.id
       JOIN payruns pr ON ps.payrun_id = pr.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE ps.id = ?`,
      [id]
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: `Payslip ${id} not found.` });
    }

    // RBAC check: Employee can only view their own payslip
    if (req.user.role === 'Employee' && req.user.employee_id !== payslip.employee_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own payslip.' });
    }

    // Fetch line items
    payslip.lines = await query(
      'SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC',
      [id]
    );

    payslip.earnings = payslip.lines.filter(l => l.category === 'Basic' || l.category === 'Allowance');
    payslip.deductions = payslip.lines.filter(l => l.category === 'Deduction');

    return res.json({ success: true, data: payslip });
  } catch (error) {
    next(error);
  }
}

/**
 * Streams generated PDF payslip directly to client
 */
async function downloadPayslipPDF(req, res, next) {
  try {
    const { id } = req.params;

    const [payslip] = await query(
      `SELECT ps.*,
              e.first_name, e.last_name, e.employee_code, e.bank_name, e.bank_account_no,
              d.name AS department_name, jp.title AS job_position_title
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE ps.id = ?`,
      [id]
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: `Payslip ${id} not found.` });
    }

    // RBAC check: Employee can only download their own payslip
    if (req.user.role === 'Employee' && req.user.employee_id !== payslip.employee_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only download your own payslip.' });
    }

    const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [id]);
    const earnings = lines.filter(l => l.category === 'Basic' || l.category === 'Allowance');
    const deductions = lines.filter(l => l.category === 'Deduction');

    const pdfBuffer = await generatePayslipPDF({
      employee: {
        first_name: payslip.first_name,
        last_name: payslip.last_name,
        employee_code: payslip.employee_code,
        department_name: payslip.department_name,
        job_position_title: payslip.job_position_title,
        bank_name: payslip.bank_name,
        bank_account_no: payslip.bank_account_no
      },
      payslip,
      earnings,
      deductions
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Payslip_${payslip.employee_code}_${payslip.period_start}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Sends single payslip via email with PDF attachment
 */
async function sendPayslipEmailHandler(req, res, next) {
  try {
    const { id } = req.params;

    const [payslip] = await query(
      `SELECT ps.*,
              e.first_name, e.last_name, e.email AS employee_email, e.employee_code,
              e.bank_name, e.bank_account_no,
              d.name AS department_name, jp.title AS job_position_title
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE ps.id = ?`,
      [id]
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found.' });
    }

    const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [id]);
    const earnings = lines.filter(l => l.category === 'Basic' || l.category === 'Allowance');
    const deductions = lines.filter(l => l.category === 'Deduction');

    const pdfBuffer = await generatePayslipPDF({
      employee: payslip,
      payslip,
      earnings,
      deductions
    });

    const result = await sendPayslipEmail(
      payslip.id,
      payslip.employee_email,
      `${payslip.first_name} ${payslip.last_name}`,
      `${payslip.period_start} to ${payslip.period_end}`,
      pdfBuffer
    );

    await logAudit(req.user?.id, 'SEND_PAYSLIP_EMAIL', 'payslip', id, { recipient: payslip.employee_email });

    return res.json({
      success: true,
      message: `Payslip email sent to ${payslip.employee_email}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk email dispatch for all payslips in a payrun
 */
async function sendBulkPayslipEmails(req, res, next) {
  try {
    const { payrun_id } = req.body;
    if (!payrun_id) {
      return res.status(400).json({ success: false, message: 'payrun_id is required.' });
    }

    const slips = await query(
      `SELECT ps.id, ps.period_start, ps.period_end,
              e.first_name, e.last_name, e.email AS employee_email, e.employee_code,
              e.bank_name, e.bank_account_no,
              d.name AS department_name, jp.title AS job_position_title
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       WHERE ps.payrun_id = ?`,
      [payrun_id]
    );

    let sentCount = 0;
    for (const slip of slips) {
      const lines = await query('SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC', [slip.id]);
      const earnings = lines.filter(l => l.category === 'Basic' || l.category === 'Allowance');
      const deductions = lines.filter(l => l.category === 'Deduction');

      const pdfBuffer = await generatePayslipPDF({
        employee: slip,
        payslip: slip,
        earnings,
        deductions
      });

      await sendPayslipEmail(
        slip.id,
        slip.employee_email,
        `${slip.first_name} ${slip.last_name}`,
        `${slip.period_start} to ${slip.period_end}`,
        pdfBuffer
      );
      sentCount++;
    }

    await logAudit(req.user?.id, 'SEND_BULK_PAYSLIP_EMAILS', 'payrun', payrun_id, { count: sentCount });

    return res.json({
      success: true,
      message: `Successfully dispatched payslip emails to ${sentCount} employees.`
    });
  } catch (error) {
    next(error);
>>>>>>> feature/backend
  }
}

module.exports = {
  getPayslips,
  getPayslipById,
  downloadPayslipPDF,
<<<<<<< HEAD
  emailPayslip,
  emailBulkPayrun
=======
  sendPayslipEmailHandler,
  sendBulkPayslipEmails
>>>>>>> feature/backend
};
