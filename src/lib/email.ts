import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  email: string, 
  name: string, 
  token: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email - Chatbot Builder',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Welcome to Chatbot Builder!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Chatbot Builder Team<br>
          ${process.env.NEXT_PUBLIC_APP_URL}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  token: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Reset Your Password - Chatbot Builder',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Chatbot Builder Team<br>
          ${process.env.NEXT_PUBLIC_APP_URL}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Welcome to Chatbot Builder!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Welcome to Chatbot Builder!</h2>
        <p>Hi ${name},</p>
        <p>Your email has been verified successfully! You can now start building amazing chatbots.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Create your first chatbot</li>
          <li>Customize the appearance</li>
          <li>Set up conversation flows</li>
          <li>Integrate with your website</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Chatbot Builder Team<br>
          ${process.env.NEXT_PUBLIC_APP_URL}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}