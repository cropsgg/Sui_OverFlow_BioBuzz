import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/biobuzz';

/**
 * Test MongoDB connection utility
 * 
 * To run this script:
 * 1. Make sure MongoDB is running
 * 2. Run: npx ts-node src/utils/test-db.ts
 */

const testDatabase = async () => {
  console.log('====================================');
  console.log('TESTING MONGODB CONNECTION');
  console.log('====================================');
  console.log(`Attempting to connect to: ${MONGODB_URI}`);
  
  try {
    // Set mongoose connection options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI);
    
    console.log('====================================');
    console.log('✅ MONGODB CONNECTION SUCCESSFUL');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`MongoDB Connection State: ${conn.connection.readyState}`);
    console.log('====================================');
    
    // Close the connection
    await mongoose.disconnect();
    console.log('Connection closed successfully');
    
  } catch (error) {
    console.error('====================================');
    console.error('❌ MONGODB CONNECTION FAILED');
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('====================================');
    console.error('TROUBLESHOOTING TIPS:');
    console.error('1. Ensure MongoDB is running');
    console.error('2. Check if the MongoDB URI is correct in your .env file');
    console.error('3. Verify network connectivity to MongoDB server');
    console.error('4. Check MongoDB authentication credentials if using auth');
    console.error('====================================');
  }
};

// Run the test
testDatabase(); 