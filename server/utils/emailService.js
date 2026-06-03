const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use Gmail App Password, not your real password
  },
});

// ─────────────────────────────────────────
// Send application-related emails
// type: 'confirmation' | 'accepted' | 'rejected'
// ─────────────────────────────────────────
const sendApplicationEmail = async ({ to, seekerName, jobTitle, companyName, type, note }) => {
  const subjects = {
    confirmation: `Application received — ${jobTitle}`,
    accepted: `🎉 Congratulations! You've been accepted — ${jobTitle}`,
    rejected: `Application update — ${jobTitle}`,
  };

  const bodies = {
    confirmation: `
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
      <p>You can track its status in your <a href="${process.env.CLIENT_URL}/seeker/applications">applications dashboard</a>.</p>
      <p>Good luck!</p>
    `,
    accepted: `
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>Great news! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color: green;">accepted</strong>.</p>
      ${note ? `<p><em>Note from employer: ${note}</em></p>` : ''}
      <p>They will be in touch with you soon.</p>
    `,
    rejected: `
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>Thank you for your interest in <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>After careful consideration, they have decided to move forward with other candidates.</p>
      ${note ? `<p><em>Feedback: ${note}</em></p>` : ''}
      <p>Keep applying — the right opportunity is out there!</p>
    `,
  };

  await transporter.sendMail({
    from: `"JobBoard" <${process.env.EMAIL_USER}>`,
    to,
    subject: subjects[type],
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">JobBoard</h2>
        ${bodies[type]}
        <hr />
        <p style="color: #888; font-size: 12px;">You received this email because you have an account on JobBoard.</p>
      </div>
    `,
  });
};

module.exports = { sendApplicationEmail };
