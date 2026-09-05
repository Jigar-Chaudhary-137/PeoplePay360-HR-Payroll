const PDFDocument = require('pdfkit');
<<<<<<< HEAD
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

=======

/**
 * Generates a clean, professional corporate payslip PDF buffer.
 */
function generatePayslipPDF(payslipData) {
>>>>>>> feature/backend
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

<<<<<<< HEAD
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
=======
      const {
        employee,
        payslip,
        earnings = [],
        deductions = [],
        company = 'PeoplePay360 Inc'
      } = payslipData;

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('PEOPLEPAY360', 60, 52);
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Intelligent HR & Payroll Operations Platform', 60, 76);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#38bdf8').text('CONFIDENTIAL PAYSLIP', 400, 62, { align: 'right', width: 140 });

      // Company and Period Information
      doc.moveDown(2);
      let y = 115;
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text('Pay Period:', 45, y);
      doc.font('Helvetica').text(`${payslip.period_start} to ${payslip.period_end}`, 120, y);

      doc.font('Helvetica-Bold').text('Payslip Ref #:', 340, y);
      doc.font('Helvetica').text(`SLIP-${String(payslip.id).padStart(6, '0')}`, 430, y);

      y += 18;
      doc.font('Helvetica-Bold').text('Payment Status:', 45, y);
      doc.font('Helvetica').fillColor(payslip.status === 'paid' ? '#16a34a' : '#d97706').text(payslip.status.toUpperCase(), 140, y);
      doc.fillColor('#334155');

      doc.font('Helvetica-Bold').text('Company:', 340, y);
      doc.font('Helvetica').text(company, 400, y);

      // Divider line
      y += 25;
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();

      // Employee Information Box
      y += 15;
      doc.rect(40, y, 515, 80).fill('#f8fafc').stroke('#e2e8f0');

      const empY = y + 10;
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Employee Name:', 55, empY);
      doc.font('Helvetica').text(`${employee.first_name} ${employee.last_name}`, 155, empY);

      doc.font('Helvetica-Bold').text('Employee ID:', 340, empY);
      doc.font('Helvetica').text(employee.employee_code || 'EMP', 430, empY);

      doc.font('Helvetica-Bold').text('Department:', 55, empY + 18);
      doc.font('Helvetica').text(employee.department_name || 'General', 155, empY + 18);

      doc.font('Helvetica-Bold').text('Designation:', 340, empY + 18);
      doc.font('Helvetica').text(employee.job_position_title || 'Staff', 430, empY + 18);

      doc.font('Helvetica-Bold').text('Bank Account:', 55, empY + 36);
      doc.font('Helvetica').text(employee.bank_account_no ? `•••• ${String(employee.bank_account_no).slice(-4)} (${employee.bank_name || 'Bank'})` : 'Not on file', 155, empY + 36);

      doc.font('Helvetica-Bold').text('Worked / Days:', 340, empY + 36);
      doc.font('Helvetica').text(`${payslip.worked_days} / ${payslip.scheduled_days || 22} Days`, 430, empY + 36);

      // Tables for Earnings & Deductions
      y += 105;

      // Table Headers
      doc.rect(40, y, 250, 24).fill('#0284c7');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('EARNINGS', 50, y + 7);
      doc.text('AMOUNT (INR)', 210, y + 7, { align: 'right', width: 70 });

      doc.rect(305, y, 250, 24).fill('#e11d48');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('DEDUCTIONS', 315, y + 7);
      doc.text('AMOUNT (INR)', 475, y + 7, { align: 'right', width: 70 });

      // Rows
      let rowY = y + 24;
      const maxRows = Math.max(earnings.length, deductions.length, 1);

      for (let i = 0; i < maxRows; i++) {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, rowY, 250, 20).fill(bg);
        doc.rect(305, rowY, 250, 20).fill(bg);

        // Earning item
        if (i < earnings.length) {
          const item = earnings[i];
          doc.fillColor('#334155').font('Helvetica').fontSize(9).text(item.name || item.code, 50, rowY + 5);
          doc.font('Helvetica-Bold').text(`₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, rowY + 5, { align: 'right', width: 90 });
        }

        // Deduction item
        if (i < deductions.length) {
          const item = deductions[i];
          doc.fillColor('#334155').font('Helvetica').fontSize(9).text(item.name || item.code, 315, rowY + 5);
          doc.font('Helvetica-Bold').text(`₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 455, rowY + 5, { align: 'right', width: 90 });
        }

        rowY += 20;
      }

      // Totals Box
      doc.rect(40, rowY, 250, 24).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('Total Earnings (Gross):', 50, rowY + 7);
      doc.text(`₹${Number(payslip.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 180, rowY + 7, { align: 'right', width: 100 });

      doc.rect(305, rowY, 250, 24).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('Total Deductions:', 315, rowY + 7);
      doc.text(`₹${Number(payslip.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, rowY + 7, { align: 'right', width: 100 });

      // Net Salary Highlight Box
      rowY += 40;
      doc.rect(40, rowY, 515, 55).fill('#ecfdf5').stroke('#10b981');
      doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(12).text('NET TAKE-HOME SALARY', 60, rowY + 12);
      doc.fontSize(9).font('Helvetica').text('(Gross Salary minus Total Statutory & Voluntary Deductions)', 60, rowY + 30);

      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(22).text(
        `₹${Number(payslip.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        300,
        rowY + 16,
        { align: 'right', width: 240 }
      );

      // Footer
      const footerY = 750;
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
        .text('This is a computer-generated payslip generated by PeoplePay360 Operations Platform and requires no physical signature.', 40, footerY + 8, { align: 'center', width: 515 });
>>>>>>> feature/backend

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePayslipPDF
};
