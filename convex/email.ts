import { action } from './_generated/server';
import { v } from 'convex/values';
import { generateInvitationEmail } from '../src/lib/email/templates/invitation';

// Send invitation email via Postmark
export const sendInvitationEmail = action({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    inviterName: v.string(),
    invitationUrl: v.string(),
    organizationName: v.string(),
    primaryColor: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, userName, inviterName, invitationUrl, organizationName, primaryColor } = args;

    // Generate HTML email content
    const htmlContent = generateInvitationEmail({
      userName,
      inviterName,
      invitationUrl,
      organizationName,
      primaryColor,
    });

    // Send email via Postmark
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN || '',
      },
      body: JSON.stringify({
        From: `${organizationName} <${process.env.POSTMARK_FROM_ADDRESS || 'noreply@strideux.com'}>`,
        To: userEmail,
        Subject: `Welcome to ${organizationName}`,
        HtmlBody: htmlContent,
        TextBody: `Hi ${userName},\n\n${inviterName} has invited you to join ${organizationName}.\n\nClick here to set your password: ${invitationUrl}\n\nThis link expires in 48 hours.\n\nBest,\nThe ${organizationName} Team`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.Message || response.statusText}`);
    }

    return { success: true };
  },
});
