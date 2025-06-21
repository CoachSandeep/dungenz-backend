const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'DUNGENZ FITNESS<onboarding@resend.dev>', // ✅ You can change this to your verified sender
      to,
      subject,
      html,
    });

    if (data?.error) {
      console.error('❌ Resend Error:', data.error);
    } else {
      console.log('✅ Email sent:', data.id);
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    throw new Error('Email send failed');
  }
};
