# LabShareDAO Backend

## Overview
A comprehensive backend system for LabShareDAO - a decentralized research laboratory collaboration platform built on the Sui blockchain. This backend provides complete integration between traditional web services and blockchain functionality, enabling seamless DAO operations.

## 🚀 Features

### Core DAO Functionality
- **Member Management**: Add, verify, and manage DAO members with Sui address linking
- **Data Submission**: Submit sensor data with automatic threshold monitoring and alert generation
- **Proposal System**: Create, vote on, and execute proposals with democratic governance
- **Treasury Management**: Manage DAO funds with transparent operations
- **Real-time Event Synchronization**: Automatic sync between blockchain and database

### Technical Features
- **Blockchain Integration**: Full Sui blockchain integration with real-time event listening
- **Database Synchronization**: Automatic MongoDB synchronization with blockchain state
- **RESTful API**: Comprehensive REST API with proper validation and error handling
- **Authentication**: JWT-based authentication with role-based access control
- **Event Processing**: Real-time event processing with reconnection handling

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Sui blockchain with @mysten/sui SDK
- **Authentication**: JWT tokens
- **Validation**: Express-validator
- **Real-time**: WebSocket-based event listening

### Project Structure
```
backend/
├── src/
│   ├── interfaces/           # TypeScript interfaces
│   │   └── dao.interface.ts  # DAO-specific interfaces (280+ lines)
│   ├── models/              # MongoDB schemas
│   │   └── dao.model.ts     # DAO models with validation and indexes
│   ├── services/            # Business logic services
│   │   ├── sui.service.ts   # Blockchain integration service
│   │   └── eventListener.service.ts # Real-time event processing
│   ├── controllers/         # API controllers
│   │   └── dao.controller.ts # DAO API controllers (780+ lines)
│   ├── routes/              # API routes
│   │   └── dao.routes.ts    # DAO route definitions
│   ├── middleware/          # Express middleware
│   ├── config/              # Configuration files
│   └── server.ts            # Main server file
├── labshare_dao/            # Sui Move smart contract
│   ├── sources/             # Move source files
│   ├── Move.toml           # Move package configuration
│   └── Move.lock           # Package lock file
├── CONFIG.md               # Comprehensive configuration guide
└── README.md              # This file
```

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Sui CLI (for contract operations)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Set up environment variables (see CONFIG.md)
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=mongodb://localhost:27017/labshare_dao

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Sui Blockchain (Set after deployment)
SUI_PACKAGE_ID=0x1c614ad1b86318b4b0360fb9296e89caf5c7648c8710d9c358e1aa8ad3f8c3ed
DAO_OBJECT_ID=0x... # Set after DAO initialization
SUI_NETWORK=devnet
```

See [CONFIG.md](./CONFIG.md) for detailed configuration instructions.

## 🚀 Deployment

### DAO Smart Contract
The DAO smart contract is already deployed on Sui Devnet:
- **Package ID**: `0x1c614ad1b86318b4b0360fb9296e89caf5c7648c8710d9c358e1aa8ad3f8c3ed`
- **Network**: Sui Devnet
- **Gas Used**: ~0.047 SUI

### Backend Initialization
```bash
# Start the server
npm run dev

# Initialize the DAO (one-time setup)
curl -X POST http://localhost:5000/api/dao/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LabShareDAO",
    "description": "Decentralized research laboratory collaboration platform",
    "adminAddress": "0x848832ddf5db118a1c11050e9bfa33b3a63206c6371e344c928917e08a450233"
  }'
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/health`

### Core Endpoints

#### DAO Management
- `POST /dao/initialize` - Initialize DAO (one-time setup)
- `GET /dao/info` - Get DAO information and statistics
- `GET /dao/dashboard` - Get comprehensive dashboard data

#### Member Management
- `POST /dao/members/link-address` - Link Sui address to user account
- `POST /dao/admin/members` - Add new member (Admin only)
- `GET /dao/members` - List all members with pagination
- `GET /dao/members/:address` - Get specific member details
- `GET /dao/user/status` - Get current user's DAO status

#### Data Submission
- `POST /dao/data` - Submit sensor data
- `GET /dao/data` - Get data records with filtering and pagination
- `GET /dao/data/:recordId` - Get specific data record

#### Proposals & Voting
- `POST /dao/proposals` - Create new proposal
- `GET /dao/proposals` - List proposals with filtering
- `GET /dao/proposals/:proposalId` - Get proposal details
- `POST /dao/proposals/:proposalId/vote` - Vote on proposal
- `POST /dao/proposals/:proposalId/execute` - Execute proposal

#### Treasury & Admin
- `POST /dao/treasury/add-funds` - Add funds to treasury
- `GET /dao/treasury/balance` - Get treasury balance
- `PUT /dao/admin/thresholds/:sensorTypeId` - Update thresholds
- `GET /dao/thresholds` - Get threshold configurations

#### Event Management
- `GET /dao/events/status` - Get event listener status
- `POST /dao/admin/events/start` - Start event listener
- `POST /dao/admin/events/stop` - Stop event listener

## 🗄️ Database Schema

### Collections
- **`daousermappings`** - Links users to Sui addresses
- **`daoinfos`** - DAO configuration and statistics
- **`sensortypes`** - Available sensor types (Temperature, Humidity, Pressure, Luminosity)
- **`thresholdconfigs`** - Sensor threshold configurations
- **`proposals`** - DAO proposals and voting data
- **`datarecords`** - Sensor data submissions with metadata

### Default Data
The system automatically creates:
- 4 sensor types with default configurations
- Default threshold ranges for each sensor type
- Proper indexes for efficient querying

## 🔗 Blockchain Integration

### Smart Contract Features
- **Member Management**: Add members with voting power
- **Data Submission**: Submit data with automatic threshold checking
- **Alert System**: Automatic proposal creation for threshold breaches
- **Voting System**: Democratic voting with configurable periods
- **Treasury**: Manage shared funds transparently

### Event Synchronization
- Real-time event listening from Sui blockchain
- Automatic MongoDB synchronization
- Reconnection handling and missed event recovery
- Manual sync capabilities for data integrity

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server
npm run test:db     # Test database connection
npm run test:email  # Test email configuration
npm run check:env   # Check environment variables
```

### API Testing
```bash
# Get DAO info
curl http://localhost:5000/api/dao/info

# Check health
curl http://localhost:5000/health

# Get dashboard stats
curl http://localhost:5000/api/dao/dashboard
```

## 🚀 Production Deployment

### Requirements
- MongoDB Atlas or self-hosted MongoDB
- Sui Mainnet/Testnet configuration
- SSL certificates for HTTPS
- Environment variable management
- Process management (PM2 recommended)

### Security Considerations
- Strong JWT secrets
- Rate limiting implementation
- CORS configuration
- Input validation and sanitization
- Error handling without information leakage

## 📊 Monitoring & Debugging

### Health Checks
- `/health` - Server health and DAO configuration
- `/api/dao/events/status` - Event listener status
- Database connection monitoring

### Logging
- Structured logging for all operations
- Blockchain event processing logs
- Error tracking and alerting
- Performance monitoring

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use proper error handling
- Write comprehensive tests
- Document new API endpoints
- Follow existing code patterns

### Code Structure
- **Interfaces**: Define all types in `interfaces/dao.interface.ts`
- **Models**: MongoDB schemas with validation in `models/dao.model.ts`
- **Services**: Business logic in `services/`
- **Controllers**: API logic in `controllers/dao.controller.ts`
- **Routes**: API definitions in `routes/dao.routes.ts`

## 📄 License
This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the [CONFIG.md](./CONFIG.md) for configuration help
2. Review console logs for detailed error messages
3. Test individual endpoints using provided examples
4. Check MongoDB collections for data integrity

## 🔗 Related

- **Smart Contract**: Located in `labshare_dao/` directory
- **Frontend**: React/Next.js application (separate repository)
- **Documentation**: Comprehensive guides in CONFIG.md

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Blockchain**: Sui Network  
**Database**: MongoDB 