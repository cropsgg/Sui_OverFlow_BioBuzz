import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import daoRoutes from './routes/dao.routes';
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dao', daoRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    dao: {
      packageId: process.env.SUI_PACKAGE_ID || 'Not configured',
      daoObjectId: process.env.DAO_OBJECT_ID || 'Not configured',
      network: process.env.SUI_NETWORK || 'devnet'
    }
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'LabShareDAO API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      dao: '/api/dao',
      health: '/health'
    },
    dao: {
      network: process.env.SUI_NETWORK || 'devnet',
      initialized: !!(process.env.SUI_PACKAGE_ID && process.env.DAO_OBJECT_ID)
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server and connect to database
const startServer = async () => {
  try {
    console.log('====================================');
    console.log('🚀 Starting LabShareDAO Backend Server');
    console.log('====================================');

    // Check environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.warn('⚠️  Missing environment variables:', missingEnvVars.join(', '));
    }

    // Check DAO configuration
    if (!process.env.SUI_PACKAGE_ID || !process.env.DAO_OBJECT_ID) {
      console.warn('⚠️  DAO not configured. Set SUI_PACKAGE_ID and DAO_OBJECT_ID to enable DAO features.');
    } else {
      console.log('✅ DAO Configuration:');
      console.log(`   Package ID: ${process.env.SUI_PACKAGE_ID}`);
      console.log(`   DAO Object ID: ${process.env.DAO_OBJECT_ID}`);
      console.log(`   Network: ${process.env.SUI_NETWORK || 'devnet'}`);
    }
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('====================================');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`🔌 API accessible at: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🗳️  DAO API: http://localhost:${PORT}/api/dao`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('====================================');
    console.error('❌ Failed to start server:');
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
  console.error('❌ UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('====================================');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('====================================');
  console.error('❌ UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error('====================================');
  process.exit(1);
}); 