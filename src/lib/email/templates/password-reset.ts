export function generatePasswordResetEmail(params: {
  userName: string;
  resetUrl: string;
  organizationName: string;
  primaryColor: string;
}) {
  const { userName, resetUrl, organizationName, primaryColor } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f7fafc;
      color: #2d3748;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 40px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      display: inline-block;
      padding: 12px 20px;
      background: ${primaryColor};
      color: white;
      font-weight: bold;
      font-size: 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a202c;
      font-size: 28px;
      margin: 0 0 10px 0;
      font-weight: 600;
    }
    .subtitle {
      color: #718096;
      font-size: 16px;
      margin: 0;
    }
    .content {
      margin: 30px 0;
      line-height: 1.6;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: ${primaryColor};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.2s;
    }
    .button:hover {
      background: ${primaryColor}dd;
    }
    .warning {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-radius: 6px;
      padding: 16px;
      margin: 30px 0;
      color: #c53030;
    }
    .warning-icon {
      display: inline-block;
      margin-right: 8px;
      font-weight: bold;
    }
    .link-text {
      margin-top: 20px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 6px;
      word-break: break-all;
      font-size: 14px;
      color: #4a5568;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${organizationName}</div>
        <h1>Reset Your Password</h1>
        <p class="subtitle">We received a request to reset your password</p>
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        <p>We received a request to reset the password for your ${organizationName} account. Click the button below to create a new password:</p>
      </div>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="warning">
        <span class="warning-icon">⚠️</span>
        <strong>This link expires in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
      </div>
      
      <div class="content">
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <div class="link-text">${resetUrl}</div>
      </div>
      
      <div class="content">
        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Never share your password with anyone</li>
          <li>Use a strong, unique password for your account</li>
          <li>Enable two-factor authentication when available</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>This is an automated message from ${organizationName}.</p>
        <p>Need help? Contact our support team.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #a0aec0;">
          © ${new Date().getFullYear()} ${organizationName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}