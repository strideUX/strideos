interface InvitationEmailProps {
  userName: string;
  inviterName: string;
  invitationUrl: string;
  organizationName?: string;
  primaryColor?: string;
}

export function generateInvitationEmail(props: InvitationEmailProps): string {
  const { userName, inviterName, invitationUrl, organizationName = 'strideUX', primaryColor = '#0E1828' } = props;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: ${primaryColor};
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-text {
            font-size: 18px;
            margin-bottom: 24px;
            color: #333;
          }
          .invitation-text {
            font-size: 16px;
            margin-bottom: 32px;
            color: #666;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background-color: ${primaryColor};
            color: white !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: ${primaryColor}dd;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer-text {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
          }
          .expiry-text {
            font-size: 12px;
            color: #999;
            margin-top: 16px;
          }
          .signature {
            margin-top: 24px;
            font-size: 14px;
            color: #666;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${organizationName}</h1>
          </div>
          
          <div class="content">
            <div class="welcome-text">
              Hi ${userName},
            </div>
            
            <div class="invitation-text">
              ${inviterName} has invited you to join ${organizationName}.
            </div>
            
            <div class="button-container">
              <a href="${invitationUrl}" class="button">
                Set Your Password
              </a>
            </div>
            
            <div class="signature">
              Best,<br>
              The ${organizationName} Team
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              This invitation was sent to you by ${inviterName}.
            </div>
            <div class="expiry-text">
              This link expires in 48 hours.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
