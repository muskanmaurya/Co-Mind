/**
 * Send invitation email to a collaborator
 * @param {string} invitedEmail - Email of the person being invited
 * @param {string} noteTitle - Title of the note
 * @param {string} inviterName - Name of the person sending the invite
 * @param {string} invitationLink - Link for the invited user to accept (or login/signup URL)
 * @param {string} role - Role being offered ('editor' or 'viewer')
 * @returns {Promise<Object>} - Result from Resend API
 */
export const sendInvitationEmail = async (
  invitedEmail,
  noteTitle,
  inviterName,
  invitationLink,
  role = 'editor'
) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const configuredFrom = String(process.env.RESEND_EMAIL_ADDRESS || '').trim();
    const personalMailboxPattern = /@(gmail|yahoo|outlook|hotmail)\./i;
    const useOnboardingFrom = !configuredFrom || personalMailboxPattern.test(configuredFrom);
    const fromAddress = useOnboardingFrom ? 'onboarding@resend.dev' : configuredFrom;
    
    const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); padding: 2rem; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Co-Mind Collaboration Invite</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 1rem 0; color: #334155; font-size: 14px;">
          <strong>${inviterName}</strong> has invited you to collaborate on a note in <strong>Co-Mind</strong>
        </p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
          <p style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Note Title</p>
          <p style="margin: 0 0 1rem 0; color: #1e293b; font-size: 16px; font-weight: 600;">${noteTitle}</p>
          
          <p style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</p>
          <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
            ${role === 'editor' ? '✏️ Editor (can make changes)' : '👁️ Viewer (read-only access)'}
          </p>
        </div>
        
        <div style="margin: 1.5rem 0;">
          <a href="${invitationLink}" style="display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Get Started
          </a>
        </div>
        
        <p style="margin: 1.5rem 0 0 0; color: #64748b; font-size: 12px; line-height: 1.6;">
          This invite expires in 30 days. If you don't have a Co-Mind account yet, you can create one and this collaboration will be automatically set up for you.
        </p>
      </div>
      
      <div style="text-align: center; padding: 1rem; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Co-Mind • AI-Powered Notes & Collaboration</p>
      </div>
    </div>
    `;

    const result = await resend.emails.send({
      from: fromAddress,
      to: invitedEmail,
      subject: `${inviterName} invited you to collaborate on "${noteTitle}"`,
      replyTo: configuredFrom || undefined,
      text: `${inviterName} invited you to collaborate on "${noteTitle}" in Co-Mind. Open: ${invitationLink}`,
      html: htmlContent,
    });

    if (result?.error) {
      const message = typeof result.error === 'string'
        ? result.error
        : result.error?.message || JSON.stringify(result.error);
      throw new Error(`Resend rejected request: ${message}`);
    }

    console.log(`✉️ Invitation email sent to ${invitedEmail}`);
    return result;
  } catch (error) {
    console.error('Failed to send invitation email:', error.message);
    throw error;
  }
};

export default { sendInvitationEmail };


