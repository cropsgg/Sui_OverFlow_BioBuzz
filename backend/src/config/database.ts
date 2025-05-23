import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ;

export const connectDB = async (): Promise<void> => {
  console.log('====================================');
  console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);
  console.log('====================================');
  
  try {
    // Set mongoose connection options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI);
    
    console.log('====================================');
    console.log(`MongoDB Connected Successfully!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`MongoDB Connection State: ${conn.connection.readyState}`);
    console.log('====================================');
  } catch (error) {
    console.error('====================================');
    console.error(`MongoDB Connection Failed!`);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('====================================');
    // Exit application on connection failure
    process.exit(1);
  }
}; 