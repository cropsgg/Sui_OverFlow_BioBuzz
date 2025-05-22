import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Environment and configuration checker utility
 * 
 * To run this script:
 * 1. Run: npx ts-node src/utils/check-env.ts
 */

const checkEnvironment = () => {
  console.log('====================================');
  console.log('CHECKING ENVIRONMENT CONFIGURATION');
  console.log('====================================');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  console.log(`1. .env file ${envExists ? 'exists ✅' : 'does not exist ❌'}`);
  if (!envExists) {
    console.warn('   RECOMMENDATION: Create a .env file in the backend directory');
  }
  
  // Check required environment variables
  const requiredEnvVars = [
    { key: 'MONGODB_URI', defaultValue: 'mongodb://localhost:27017/biobuzz' },
    { key: 'JWT_SECRET', defaultValue: 'your_jwt_secret_key' },
    { key: 'JWT_EXPIRES_IN', defaultValue: '7d' },
    { key: 'EMAIL_HOST', defaultValue: 'sandbox.smtp.mailtrap.io' },
    { key: 'EMAIL_PORT', defaultValue: '2525' },
    { key: 'EMAIL_USER', defaultValue: '' },
    { key: 'EMAIL_PASS', defaultValue: '' },
    { key: 'EMAIL_FROM', defaultValue: 'noreply@biobuzz.io' },
    { key: 'CLIENT_URL', defaultValue: 'http://localhost:3000' }
  ];
  
  console.log('\n2. Environment Variables:');
  
  requiredEnvVars.forEach(({ key, defaultValue }) => {
    const value = process.env[key];
    const isSet = !!value;
    const isDefault = value === defaultValue;
    
    if (isSet) {
      // For sensitive values, don't show the actual value
      const isSensitive = key.includes('SECRET') || key.includes('PASS') || key.includes('KEY');
      const displayValue = isSensitive ? '[HIDDEN]' : value;
      
      if (key === 'MONGODB_URI') {
        console.log(`   ${key}: ${displayValue} ✅`);
      } else if (isDefault && defaultValue !== '') {
        console.log(`   ${key}: ${displayValue} ⚠️ (using default value)`);
      } else {
        console.log(`   ${key}: ${displayValue} ✅`);
      }
    } else {
      console.log(`   ${key}: not set ❌ (will use default: ${defaultValue})`);
    }
  });
  
  // Check MongoDB connection
  console.log('\n3. MongoDB Configuration:');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biobuzz';
  const isLocalhost = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
  
  console.log(`   Connection URI: ${mongoUri}`);
  
  if (isLocalhost) {
    console.log('   Using local MongoDB ⚠️');
    console.log('   NOTE: Ensure MongoDB is installed and running locally');
  } else {
    console.log('   Using remote MongoDB ℹ️');
    console.log('   NOTE: Ensure network connectivity to the remote server');
  }

  // Check package dependencies
  console.log('\n4. Required packages:');
  const requiredPackages = ['mongoose', 'express', 'nodemailer', 'jsonwebtoken'];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    requiredPackages.forEach(pkg => {
      if (dependencies[pkg]) {
        console.log(`   ${pkg}: installed ✅ (version: ${dependencies[pkg]})`);
      } else {
        console.log(`   ${pkg}: not installed ❌`);
      }
    });
  } catch (error) {
    console.error('   Could not read package.json file ❌');
  }
  
  console.log('\n====================================');
  console.log('ENVIRONMENT CHECK COMPLETE');
  console.log('====================================');
};

// Run the check
checkEnvironment(); 