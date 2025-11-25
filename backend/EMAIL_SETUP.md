# Email Service Setup for Password Reset

## Overview
The password reset feature now sends a 6-digit verification code via email to users who request a password reset.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Email Settings

#### For Gmail:
1. Go to your Google Account settings: https://myaccount.google.com/
2. Enable 2-Step Verification (if not already enabled)
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Generate and copy the 16-character password

4. Update `.env` file in the backend directory:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

#### For Other Email Services:
Update `backend/services/emailService.js` transporter configuration:

**For Outlook/Hotmail:**
```javascript
service: 'hotmail',
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
}
```

**For Yahoo:**
```javascript
service: 'yahoo',
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
}
```

**For Custom SMTP:**
```javascript
host: 'smtp.example.com',
port: 587,
secure: false,
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
}
```

### 3. Test the Email Service

Start your backend server:
```bash
cd backend
npm start
```

The server will verify the email connection on startup. Look for:
```
✅ Email service is ready to send emails
```

### 4. Security Notes

⚠️ **Important Security Practices:**
- Never commit `.env` file to version control
- Use app-specific passwords, not your main email password
- Keep your `.env` file in `.gitignore`
- Rotate email passwords periodically
- Use environment variables in production

### 5. How It Works

1. User requests password reset with their email
2. System generates a 6-digit code
3. Code is saved to database with 15-minute expiry
4. Email is sent with the verification code
5. User enters code in the app
6. If valid, user can set a new password

## Email Template Features

The password reset email includes:
- Professional branded design
- Large, easy-to-read 6-digit code
- 15-minute expiry warning
- Security notice for unauthorized requests
- Mobile-friendly responsive design

## Troubleshooting

### Email not sending:
1. Check `.env` file has correct credentials
2. Verify app password is generated correctly
3. Check server logs for detailed error messages
4. Ensure 2FA is enabled on your email account

### "Invalid login" error:
- You may be using your regular password instead of app password
- Generate a new app-specific password from your email provider

### Gmail blocking sign-in:
- Enable "Less secure app access" (not recommended)
- Better: Use App Passwords with 2FA enabled

### Code not received:
- Check spam/junk folder
- Verify email address is correct
- Check server logs to confirm email was sent
- Try with a different email provider

## Development Mode

If email service fails, the system will:
- Still save the reset code to database
- Log the code to console for testing
- Return success message to user

This allows development without email configuration.

## Production Deployment

For production:
1. Use environment variables through your hosting platform
2. Consider using a dedicated email service (SendGrid, AWS SES, etc.)
3. Implement rate limiting for forgot-password endpoint
4. Add monitoring for email delivery failures
5. Consider implementing backup SMS verification

## API Endpoints

**Request Reset Code:**
```
POST /api/forgot-password
Body: { "email": "user@example.com" }
```

**Verify Code:**
```
POST /api/verify-reset-code
Body: { "email": "user@example.com", "code": "123456" }
```

**Reset Password:**
```
POST /api/reset-password
Body: { 
  "email": "user@example.com", 
  "code": "123456",
  "newPassword": "newpassword123"
}
```

## Files Modified

- `backend/services/emailService.js` - Email sending service
- `backend/routes/userRoutes.js` - Updated forgot-password route
- `backend/package.json` - Added nodemailer dependency
- `backend/.env` - Added email configuration
