import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Create reusable transporter using Mailtrap
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  });

  // Define mail options
  const mailOptions = {
    from: `BioBuzz <${process.env.EMAIL_FROM || 'noreply@biobuzz.io'}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const verificationUrl = `${clientUrl}/verify-email/${token}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #4f46e5; text-align: center;">Email Verification</h1>
      <p>Thank you for registering with BioBuzz. Please verify your email by clicking on the link below:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      </div>
      <p>If you did not sign up for this account, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        &copy; ${new Date().getFullYear()} BioBuzz. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Email Verification - BioBuzz',
    message
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password/${token}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #4f46e5; text-align: center;">Password Reset</h1>
      <p>You are receiving this email because you (or someone else) has requested the reset of your password.</p>
      <p>Please click on the link below to reset your password:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This link will expire in 10 minutes.</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
        &copy; ${new Date().getFullYear()} BioBuzz. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset - BioBuzz',
    message
  });
}; 