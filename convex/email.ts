import { action } from './_generated/server';
import { v } from 'convex/values';
import { generateInvitationEmail } from '../src/lib/email/templates/invitation';
import { generatePasswordResetEmail } from '../src/lib/email/templates/password-reset';

// Use Node.js runtime for HTTP requests
export const sendInvitationEmail = action({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    inviterName: v.string(),
    invitationUrl: v.string(),
    organizationName: v.string(),
    primaryColor: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, userName, inviterName, invitationUrl, organizationName, primaryColor, fromEmail, fromName } = args;

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
        From: `${fromName} <${fromEmail}>`,
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

// Send password reset email
export const sendPasswordResetEmail = action({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    resetUrl: v.string(),
    organizationName: v.string(),
    primaryColor: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userEmail, userName, resetUrl, organizationName, primaryColor, fromEmail, fromName } = args;

    // Generate HTML email content
    const htmlContent = generatePasswordResetEmail({
      userName,
      resetUrl,
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
        From: `${fromName} <${fromEmail}>`,
        To: userEmail,
        Subject: `Reset Your ${organizationName} Password`,
        HtmlBody: htmlContent,
        TextBody: `Hi ${userName},\n\nWe received a request to reset your ${organizationName} password.\n\nClick here to reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\nBest,\nThe ${organizationName} Team`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.Message || response.statusText}`);
    }

    return { success: true };
  },
});


