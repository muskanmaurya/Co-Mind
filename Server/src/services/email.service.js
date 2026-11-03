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
    to,
    subject: `✨ Workspace Invite: Collaborate on "${noteTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .email-wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .email-header { background: #0f172a; color: #ffffff; padding: 24px 32px; text-align: left; }
          .email-header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }
          .email-body { padding: 32px; color: #334155; line-height: 1.6; }
          .note-card { background: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
          .note-title { font-weight: 600; color: #0f172a; font-size: 16px; margin: 0 0 4px 0; }
          .role-badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .cta-container { text-align: center; margin: 32px 0 16px 0; }
          .cta-button { background-color: #0284c7; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2); }
          .email-footer { padding: 20px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-header">
            <h1>Co-Mind Workspace</h1>
          </div>
          <div class="email-body">
            <p>Hi there,</p>
            <p><strong>${ownerName || 'A teammate'}</strong> has invited you to collaborate on a shared workspace document on Co-Mind.</p>
            
            <div class="note-card">
              <p class="note-title">📄 ${noteTitle}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Assigned Role: <span class="role-badge">${role || 'Editor'}</span></p>
            </div>

            <p>Click the button below to accept your invitation, sign in, and jump right into the live editing environment:</p>

            <div class="cta-container">
              <a href="${inviteLink}" target="_blank" class="cta-button">Accept Invitation & Join</a>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-top: 24px; word-break: break-all;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #0284c7;">${inviteLink}</a>
            </p>
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Co-Mind AI Workspace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};