const { query } = require('../config/db');
const { generatePayslipPDF } = require('../services/pdfService');
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
  }
}

module.exports = {
  getPayslips,
  getPayslipById,
  downloadPayslipPDF,
  emailPayslip,
  emailBulkPayrun
};
