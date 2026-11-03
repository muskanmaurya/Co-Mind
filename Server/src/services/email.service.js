import nodemailer from 'nodemailer';

export const sendInviteEmail = async ({ to, noteTitle, ownerName, inviteLink, role }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Co-Mind Workspace" <${process.env.EMAIL_USER}>`,
    to, // Now correctly pulls `to` out of the destructured object!
    subject: `${ownerName || 'Collaborator'} invited you to collaborate on "${noteTitle}" (${role})`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Co-Mind Collaboration Invite</h2>
        <p>You have been invited to collaborate on <strong>${noteTitle}</strong> as a <strong>${role}</strong>.</p>
        <p>Click the link below to accept the invitation and start working:</p>
        <a href="${inviteLink}" style="background-color: #0284c7; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Accept Invitation</a>
      </div>
    `,
  };

  console.log("📧 Attempting to send email TO:", to);

  return transporter.sendMail(mailOptions);
};