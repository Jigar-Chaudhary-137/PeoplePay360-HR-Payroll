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

    return { 
      success: true, 
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || null 
    };
  } catch (error) {
    console.error(`❌ Failed to send payslip email for slip ${payslipId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Dispatches a password reset email containing the secure reset URL.
 */
async function sendPasswordResetEmail(recipientEmail, recipientName, resetUrl) {
  const mailer = getTransporter();

  const sender = process.env.SMTP_FROM || '"PeoplePay360 HR" <payroll@peoplepay360.com>';
  const safeName = recipientName ? recipientName.trim() : 'Team Member';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; padding: 28px 32px; text-align: left; }
        .logo { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .logo-sub { color: #818cf8; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-top: 4px; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25); }
        .note { font-size: 12px; color: #64748b; line-height: 1.5; background-color: #f1f5f9; padding: 14px 16px; border-radius: 8px; margin-top: 24px; border-left: 3px solid #6366f1; }
        .link-fallback { font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 20px; }
        .footer { padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PEOPLEPAY360</div>
          <div class="logo-sub">Intelligent HR & Payroll Operations</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${safeName},</div>
          <p class="text">
            We received a request to reset the password for your PeoplePay360 account associated with <strong>${recipientEmail}</strong>.
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <div class="note">
            <strong>Security Notice:</strong> This password reset link is valid for <strong>60 minutes</strong> and can only be used once. If you did not make this request, you can safely ignore this email — your account remains secure.
          </div>
          <div class="link-fallback">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PeoplePay360 Inc. All rights reserved. &bull; Enterprise HR & Payroll Platform
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${safeName},\n\nWe received a request to reset the password for your PeoplePay360 account.\n\nPlease use the following link to reset your password (valid for 60 minutes):\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nPeoplePay360 Team`;

  const mailOptions = {
    from: sender,
    to: recipientEmail,
    subject: 'PeoplePay360 - Password Reset Request',
    text,
    html
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`📨 [Email Dispatch] Password reset email sent to: ${recipientEmail} (Message ID: ${info.messageId})`);
    if (previewUrl) {
      console.log(`🔗 [Ethereal Preview URL]: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${recipientEmail}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyTransporter() {
  const mailer = getTransporter();
  if (mailer.verify) {
    return await mailer.verify();
  }
  return true;
}

module.exports = {
  sendPayslipEmail,
  sendPasswordResetEmail,
  verifyTransporter,
  getTransporter
};
