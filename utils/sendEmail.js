const nodemailer = require('nodemailer');

module.exports = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or your email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"DUNGENZ" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};
