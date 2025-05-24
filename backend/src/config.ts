import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
const config = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: process.env.PORT || 5000,
  
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/biobuzz',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '2525'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@biobuzz.io',
  MAILTRAP_API_TOKEN: process.env.MAILTRAP_API_TOKEN || '',
  
  // Frontend URL for links in emails
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Biomedical AI Model configuration
  BIOMEDICAL_MODEL_URL: process.env.BIOMEDICAL_MODEL_URL || 'http://localhost:8000',
};

export default config; 