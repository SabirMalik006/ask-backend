const nodemailer = require('nodemailer');

/**
 * Utility function to send an email using Nodemailer
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async (options) => {
  try {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Check if configuration exists
    if (!user || !pass) {
      console.warn('Nodemailer warning: EMAIL_USER and EMAIL_PASS are not configured in .env. Skipping email delivery.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port || '587'),
      secure: port === '465', // true for 465, false for 587
      auth: {
        user: user,
        pass: pass
      }
    });

    const mailOptions = {
      from: `ASK Websolutions Careers <${process.env.EMAIL_FROM || user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email successfully sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer delivery failure: ', error.message);
    return null;
  }
};

module.exports = sendEmail;
