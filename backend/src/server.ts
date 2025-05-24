import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
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
// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Store messages for each room
const roomMessages: Record<string, any[]> = {
  general: [],
  quantum: [],
  genomics: [],
  mit: [],
  stanford: []
};

// Store active users in each room
const roomUsers: Record<string, Set<string>> = {
  general: new Set(),
  quantum: new Set(),
  genomics: new Set(),
  mit: new Set(),
  stanford: new Set()
};

// Initialize with some sample messages
const initializeRooms = () => {
  const sampleUsers = ["Dr. Chen", "Dr. Williams", "Dr. Smith", "Dr. Johnson"];
  const sampleAvatars = [
    "/abstract-avatar.png",
    "/abstract-avatar-2.png",
    "/abstract-avatar-3.png",
    "/abstract-avatar-4.png"
  ];

  // Sample messages for general room
  roomMessages.general = [
    {
      id: "1",
      username: "Dr. Chen",
      message: "Hey everyone, I've just uploaded the new dataset to the shared repository. You can access it now.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      avatar: "/abstract-avatar.png",
      roomId: "general"
    },
    {
      id: "2",
      username: "Dr. Williams",
      message: "Thanks Chen! I'll take a look at it right away. Did you include the metadata for the samples?",
      timestamp: new Date(Date.now() - 1000 * 60 * 28),
      avatar: "/abstract-avatar-2.png",
      roomId: "general"
    },
    {
      id: "3",
      username: "Dr. Chen",
      message: "Yes, everything is included in the metadata.json file. Let me know if you need anything else.",
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      avatar: "/abstract-avatar.png",
      roomId: "general"
    }
  ];

  // Sample messages for other rooms
  roomMessages.quantum = [
    {
      id: "4",
      username: "Dr. Williams",
      message: "Let's discuss the simulation results from yesterday's quantum experiment.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      avatar: "/abstract-avatar-2.png",
      roomId: "quantum"
    }
  ];

  roomMessages.genomics = [
    {
      id: "5",
      username: "Dr. Smith",
      message: "The CRISPR results look promising. We achieved 87% efficiency in the target sequence.",
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      avatar: "/abstract-avatar-3.png",
      roomId: "genomics"
    }
  ];
};

// Initialize rooms with sample messages
initializeRooms();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('joinRoom', ({ username, roomId }) => {
    // Join the socket.io room
    socket.join(roomId);

    // Add user to room users
    if (roomUsers[roomId]) {
      roomUsers[roomId].add(username);
    }

    console.log(`${username} joined room: ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('userJoined', { username, roomId });
  });

  // Leave a room
  socket.on('leaveRoom', ({ username, roomId }) => {
    // Leave the socket.io room
    socket.leave(roomId);

    // Remove user from room users
    if (roomUsers[roomId]) {
      roomUsers[roomId].delete(username);
    }

    console.log(`${username} left room: ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('userLeft', { username, roomId });
  });

  // Get room history
  socket.on('getRoomHistory', ({ roomId }) => {
    // Send room message history to the client
    socket.emit('roomHistory', { messages: roomMessages[roomId] || [] });
  });

  // Send a message
  socket.on('sendMessage', (message) => {
    const { roomId } = message;

    // Add message to room history
    if (roomMessages[roomId]) {
      roomMessages[roomId].push(message);

      // Keep only the last 100 messages
      if (roomMessages[roomId].length > 100) {
        roomMessages[roomId] = roomMessages[roomId].slice(-100);
      }
    }

    // Broadcast message to everyone in the room (including sender)
    io.to(roomId).emit('message', message);

    console.log(`Message sent in ${roomId} by ${message.username}: ${message.message}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

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
