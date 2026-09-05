const nodemailer = require('nodemailer');
<<<<<<< HEAD
const { generatePayslipPDF } = require('./pdfService');
=======
>>>>>>> feature/backend
const { query } = require('../config/db');

let transporter = null;

<<<<<<< HEAD
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate test account for Ethereal email testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[EmailService] Initialized test Ethereal SMTP with user: ${testAccount.user}`);
    } catch (e) {
      console.warn('[EmailService] SMTP unavailable, running in preview mock mode:', e.message);
      transporter = null;
    }
  }

=======
function getTransporter() {
  if (!transporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // In development / demo environment without SMTP credentials, use a simulated transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log(`📨 [Simulated Email Dispatch] To: ${mailOptions.to}, Subject: "${mailOptions.subject}"`);
          return { messageId: `mock-${Date.now()}@peoplepay360.local` };
        }
      };
    }
  }
>>>>>>> feature/backend
  return transporter;
}

/**
<<<<<<< HEAD
 * Sends a single payslip to employee by email with PDF attached
 */
async function sendPayslipEmail(payslipId) {
  const payslips = await query(
    `SELECT p.*, e.first_name, e.last_name, e.email, e.emp_code
     FROM payslips p
     JOIN employees e ON p.employee_id = e.id
     WHERE p.id = ?`,
    [payslipId]
  );

  if (payslips.length === 0) {
    throw new Error(`Payslip ID ${payslipId} not found.`);
  }

  const ps = payslips[0];
  const pdfBuffer = await generatePayslipPDF(payslipId);

  const t = await getTransporter();
  let messageId = `msg_${Date.now()}_${payslipId}`;
  let previewUrl = null;

  if (t) {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || '"PeoplePay360 HR Operations" <payroll@peoplepay360.com>',
      to: ps.email,
      subject: `Payslip for ${ps.period_month} - ${ps.first_name} ${ps.last_name} (${ps.emp_code})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; margin-top: 0;">PeoplePay360 Operations</h2>
          <p>Dear <strong>${ps.first_name} ${ps.last_name}</strong>,</p>
          <p>Your official salary payslip for the payroll period <strong>${ps.period_month}</strong> is now available.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Payslip Code:</strong> ${ps.payslip_code}</p>
            <p style="margin: 5px 0;"><strong>Gross Salary:</strong> ₹${Number(ps.gross_salary).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Total Deductions:</strong> ₹${Number(ps.total_deductions).toLocaleString()}</p>
            <p style="margin: 5px 0; color: #0284c7; font-size: 16px;"><strong>Net Payable:</strong> ₹${Number(ps.net_salary).toLocaleString()}</p>
          </div>
          <p>Please find attached your detailed PDF payslip for your records and tax filing.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated system email from PeoplePay360 HR & Payroll Platform. Please do not reply directly to this email.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Payslip_${ps.period_month}_${ps.emp_code}.pdf`,
=======
 * Dispatches a payslip PDF to an employee email and records status in DB.
 */
async function sendPayslipEmail(payslipId, recipientEmail, employeeName, periodString, pdfBuffer) {
  try {
    const mailer = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'payroll@peoplepay360.com',
      to: recipientEmail,
      subject: `Your PeoplePay360 Payslip for ${periodString}`,
      text: `Hello ${employeeName},\n\nYour salary payslip for ${periodString} is ready. Please find the attached confidential PDF payslip.\n\nBest regards,\nPeoplePay360 Payroll Operations`,
      attachments: [
        {
          filename: `Payslip_${periodString.replace(/\s+/g, '_')}.pdf`,
>>>>>>> feature/backend
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
<<<<<<< HEAD
    });

    messageId = info.messageId;
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
  }

  // Record sent status in DB
  await query(
    `UPDATE payslips SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
    [payslipId]
  );

  return {
    success: true,
    payslipId,
    recipientEmail: ps.email,
    messageId,
    previewUrl
  };
}

/**
 * Bulk dispatch payslips for an entire payrun
 */
async function sendBulkPayrunEmails(payrunId) {
  const payslips = await query(
    `SELECT id FROM payslips WHERE payrun_id = ? AND status IN ('validated', 'paid')`,
    [payrunId]
  );

  const results = [];
  for (const ps of payslips) {
    try {
      const res = await sendPayslipEmail(ps.id);
      results.push(res);
    } catch (err) {
      results.push({
        success: false,
        payslipId: ps.id,
        error: err.message
      });
    }
  }

  return {
    total: payslips.length,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    details: results
  };
}

module.exports = {
  sendPayslipEmail,
  sendBulkPayrunEmails
=======
    };

    const info = await mailer.sendMail(mailOptions);

    // Update database record
    await query(
      `UPDATE payslips 
       SET email_sent = TRUE, email_sent_at = NOW() 
       WHERE id = ?`,
      [payslipId]
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send payslip email for slip ${payslipId}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPayslipEmail
>>>>>>> feature/backend
};
