import dotenv from 'dotenv';
import emailUtil from './email.util';

// Load environment variables
dotenv.config();

/**
 * Test email script
 * 
 * To run this script:
 * 1. Make sure you have set up your .env file with Mailtrap credentials
 * 2. Run: ts-node src/utils/test-email.ts
 */

const testEmails = async () => {
  try {
    console.log('Testing email service with Mailtrap...');
    
    // Test verification email
    console.log('Sending verification email...');
    const verificationResult = await emailUtil.sendVerificationEmail('test@example.com', 'Test User', 'test-verification-token-123');
    console.log(`Verification email ${verificationResult ? 'sent successfully!' : 'failed to send.'}`);
    
    // Test password reset email
    console.log('Sending password reset email...');
    const resetResult = await emailUtil.sendPasswordResetEmail('test@example.com', 'Test User', 'test-reset-token-456');
    console.log(`Password reset email ${resetResult ? 'sent successfully!' : 'failed to send.'}`);
    
    console.log('Email tests completed. Check your Mailtrap inbox to see the emails.');
  } catch (error) {
    console.error('❌ Error testing emails:', error);
  }
};

// Run the tests
testEmails(); 