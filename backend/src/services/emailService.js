const nodemailer = require('nodemailer');
const { query } = require('../config/db');

let transporter = null;

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
  return transporter;
}

/**
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
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
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
};
