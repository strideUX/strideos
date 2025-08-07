import { ServerClient } from 'postmark';

// Initialize Postmark client
export const postmarkClient = new ServerClient(
  process.env.POSTMARK_SERVER_TOKEN || ''
);

// Email configuration
export const emailConfig = {
  fromAddress: process.env.POSTMARK_FROM_ADDRESS || 'noreply@strideux.com',
  fromName: process.env.POSTMARK_FROM_NAME || 'strideUX',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  organizationName: 'strideUX',
  primaryColor: '#0E1828',
};

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Email sending wrapper with error handling
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
) {
  try {
    if (!isValidEmail(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    const response = await postmarkClient.sendEmail({
      From: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
