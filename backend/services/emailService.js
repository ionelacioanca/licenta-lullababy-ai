import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Create a transporter using Gmail or other email service
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your app password
      },
    });
  }

  async sendPasswordResetCode(email, resetCode, userName) {
    const mailOptions = {
      from: `"LullaBaby AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code - LullaBaby AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #FFF8F0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #A2E884;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .content p {
              color: #333;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .reset-code {
              background-color: #F6FFF2;
              border: 2px solid #A2E884;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              display: inline-block;
            }
            .reset-code-label {
              color: #666;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .reset-code-value {
              font-size: 36px;
              font-weight: bold;
              color: #333;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .expiry-notice {
              color: #FF6B6B;
              font-size: 14px;
              font-weight: 500;
              margin-top: 20px;
            }
            .footer {
              background-color: #F9F9F9;
              padding: 20px 30px;
              text-align: center;
              border-top: 1px solid #E0E0E0;
            }
            .footer p {
              color: #999;
              font-size: 12px;
              margin: 5px 0;
            }
            .security-notice {
              background-color: #FFF3CD;
              border-left: 4px solid #FFB84D;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
            }
            .security-notice p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍼 LullaBaby AI</h1>
            </div>
            <div class="content">
              <p>Hello${userName ? ` ${userName}` : ''},</p>
              <p>We received a request to reset your password. Use the verification code below to complete the password reset process:</p>
              
              <div class="reset-code">
                <div class="reset-code-label">Your Reset Code</div>
                <div class="reset-code-value">${resetCode}</div>
              </div>
              
              <p class="expiry-notice">⚠️ This code will expire in 15 minutes</p>
              
              <div class="security-notice">
                <p><strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
              </div>
              
              <p>For your security, never share this code with anyone.</p>
            </div>
            <div class="footer">
              <p>© 2025 LullaBaby AI. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello${userName ? ` ${userName}` : ''},

We received a request to reset your password for LullaBaby AI.

Your password reset code is: ${resetCode}

This code will expire in 15 minutes.

If you didn't request a password reset, please ignore this email.

For your security, never share this code with anyone.

© 2025 LullaBaby AI. All rights reserved.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Test email connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
