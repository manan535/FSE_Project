/**
 * Email Service — Reusable Nodemailer transporter
 * 
 * Uses environment variables for SMTP configuration.
 * Provides a single `sendEmail()` function with retry logic,
 * async/await handling, and structured error logging.
 */

import nodemailer from 'nodemailer';

// ─── Create reusable SMTP transporter ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Connection pool for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

/**
 * Send an email with automatic retry logic.
 *
 * @param {string} to        — Recipient email address
 * @param {string} subject   — Email subject line
 * @param {string} html      — HTML body content
 * @param {number} retries   — Number of retry attempts (default 3)
 * @returns {Promise<object>} — Nodemailer send result
 */
export const sendEmail = async (to, subject, html, retries = 3) => {
  const mailOptions = {
    from: `"ScaleNest" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      // If this was the last attempt, throw
      if (attempt === retries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s …
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Verify SMTP connection (useful at server start to validate config).
 */
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

export default { sendEmail, verifyEmailConnection };
