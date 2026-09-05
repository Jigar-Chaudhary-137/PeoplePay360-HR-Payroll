const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional corporate payslip PDF buffer.
 */
function generatePayslipPDF(payslipData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

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

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePayslipPDF
};
