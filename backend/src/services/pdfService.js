const PDFDocument = require('pdfkit');
const { query } = require('../config/db');

/**
 * Generates a branded, server-side PDF payslip buffer
 */
async function generatePayslipPDF(payslipId) {
  // Load comprehensive payslip data
  const payslips = await query(
    `SELECT p.*,
            e.emp_code, e.first_name, e.last_name, e.email, e.phone, e.pan_number,
            e.bank_name, e.bank_account_no, e.bank_ifsc, e.joining_date,
            d.name as department_name, jp.title as job_title,
            s.name as structure_name, pr.name as payrun_name
     FROM payslips p
     JOIN employees e ON p.employee_id = e.id
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN job_positions jp ON e.job_position_id = jp.id
     JOIN salary_structures s ON p.salary_structure_id = s.id
     JOIN payruns pr ON p.payrun_id = pr.id
     WHERE p.id = ?`,
    [payslipId]
  );

  if (payslips.length === 0) {
    throw new Error(`Payslip ID ${payslipId} not found.`);
  }

  const ps = payslips[0];

  // Load line items
  const lines = await query(
    `SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC`,
    [payslipId]
  );

  const earnings = lines.filter(l => l.category === 'BASIC' || l.category === 'ALLOWANCE');
  const deductions = lines.filter(l => l.category === 'DEDUCTION');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Top Banner / Header
      doc.rect(40, 40, 515, 65).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('PEOPLEPAY360', 60, 52);
      doc.fontSize(10).font('Helvetica').text('Intelligent HR & Payroll Operations Platform', 60, 75);
      doc.fontSize(12).font('Helvetica-Bold').text('PAYSLIP', 430, 55, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`Period: ${ps.period_month}`, 430, 72, { align: 'right' });
      doc.text(`Slip No: ${ps.payslip_code}`, 430, 85, { align: 'right' });

      // Employee Information Box
      let y = 120;
      doc.rect(40, y, 515, 95).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('EMPLOYEE SUMMARY', 55, y + 10);

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b').text('Employee Name:', 55, y + 30);
      doc.font('Helvetica').fillColor('#0f172a').text(`${ps.first_name} ${ps.last_name}`, 145, y + 30);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Employee Code:', 55, y + 45);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.emp_code, 145, y + 45);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Department:', 55, y + 60);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.department_name || 'General', 145, y + 60);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Designation:', 55, y + 75);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.job_title || 'Staff', 145, y + 75);

      // Right column of info
      doc.font('Helvetica-Bold').fillColor('#64748b').text('Bank Name:', 310, y + 30);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.bank_name || 'Not Configured', 390, y + 30);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Bank Account:', 310, y + 45);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.bank_account_no || 'N/A', 390, y + 45);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('IFSC Code:', 310, y + 60);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.bank_ifsc || 'N/A', 390, y + 60);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('PAN / Tax ID:', 310, y + 75);
      doc.font('Helvetica').fillColor('#0f172a').text(ps.pan_number || 'N/A', 390, y + 75);

      // Attendance Metrics Strip
      y = 225;
      doc.rect(40, y, 515, 32).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
      doc.text(`Total Days: ${ps.total_days}`, 55, y + 10);
      doc.text(`Worked Days: ${ps.worked_days}`, 180, y + 10);
      doc.text(`Paid Leaves: ${ps.paid_leave_days}`, 310, y + 10);
      doc.text(`Unpaid / LOP Days: ${ps.unpaid_leave_days}`, 425, y + 10);

      // Earnings & Deductions Table Header
      y = 268;
      // Earnings Column Header
      doc.rect(40, y, 250, 24).fill('#0ea5e9');
      doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text('EARNINGS', 50, y + 7);
      doc.text('AMOUNT (₹)', 220, y + 7, { align: 'right' });

      // Deductions Column Header
      doc.rect(305, y, 250, 24).fill('#ef4444');
      doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text('DEDUCTIONS', 315, y + 7);
      doc.text('AMOUNT (₹)', 485, y + 7, { align: 'right' });

      // Table Rows
      y = 295;
      const maxRows = Math.max(earnings.length, deductions.length, 5);
      const rowHeight = 20;

      for (let i = 0; i < maxRows; i++) {
        const rowY = y + (i * rowHeight);
        const earn = earnings[i];
        const ded = deductions[i];

        // Alternating row background
        if (i % 2 === 0) {
          doc.rect(40, rowY, 250, rowHeight).fill('#f8fafc');
          doc.rect(305, rowY, 250, rowHeight).fill('#f8fafc');
        }

        // Earning item
        if (earn) {
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(earn.rule_name, 50, rowY + 5);
          doc.font('Helvetica-Bold').text(`₹${Number(earn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, rowY + 5, { align: 'right' });
        }

        // Deduction item
        if (ded) {
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(ded.rule_name, 315, rowY + 5);
          doc.font('Helvetica-Bold').text(`₹${Number(ded.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 485, rowY + 5, { align: 'right' });
        }
      }

      // Totals Row
      const totalsY = y + (maxRows * rowHeight) + 5;
      doc.rect(40, totalsY, 250, 24).fillAndStroke('#e2e8f0', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Total Gross Earnings:', 50, totalsY + 7);
      doc.text(`₹${Number(ps.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, totalsY + 7, { align: 'right' });

      doc.rect(305, totalsY, 250, 24).fillAndStroke('#e2e8f0', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('Total Deductions:', 315, totalsY + 7);
      doc.text(`₹${Number(ps.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 485, totalsY + 7, { align: 'right' });

      // Net Salary Highlight Box
      const netY = totalsY + 40;
      doc.rect(40, netY, 515, 60).fillAndStroke('#0f172a', '#0284c7');
      doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold').text('NET PAYABLE SALARY', 60, netY + 14);
      doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8').text('(Transferred to Bank Account via NEFT/Direct Deposit)', 60, netY + 32);

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#ffffff').text(`₹ ${Number(ps.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 350, netY + 20, { align: 'right' });

      // Footer & Disclaimer
      const footY = 720;
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, footY).lineTo(555, footY).stroke();
      doc.fillColor('#64748b').fontSize(8).font('Helvetica')
        .text('This is a computer-generated payslip and requires no physical signature. Generated by PeoplePay360 Operations Platform.', 40, footY + 12, { align: 'center' });
      doc.text('Confidential - For recipient employee only.', 40, footY + 25, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePayslipPDF
};
