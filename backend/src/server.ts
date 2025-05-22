import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('Initializing database connection...');
    await connectDB();
    
    // Start Express server
app.listen(PORT, () => {
      console.log('====================================');
  console.log(`Server running on port ${PORT}`);
      console.log(`Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`API accessible at: http://localhost:${PORT}/api`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('====================================');
    console.error('Failed to start server:');
    console.error(error);
    console.error('====================================');
    process.exit(1);
  }
};

// Call the start server function
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('====================================');
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('====================================');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('====================================');
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('====================================');
  process.exit(1);
}); 