# LabShareDAO Backend Configuration Guide

## Overview
This guide covers the complete setup and configuration of the LabShareDAO backend system, including blockchain integration, database setup, and API configuration.

## Environment Variables

### Required Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```bash
# ================================
# DATABASE CONFIGURATION
# ================================
DATABASE_URL=mongodb://localhost:27017/labshare_dao
# For MongoDB Atlas: DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/labshare_dao

# ================================
# SERVER CONFIGURATION
# ================================
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ================================
# JWT AUTHENTICATION
# ================================
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# ================================
# SUI BLOCKCHAIN CONFIGURATION
# ================================
# These will be set after deploying the DAO contract
SUI_PACKAGE_ID=0x1c614ad1b86318b4b0360fb9296e89caf5c7648c8710d9c358e1aa8ad3f8c3ed
DAO_OBJECT_ID=0x... # Set after DAO initialization
SUI_NETWORK=devnet
# Available networks: mainnet, testnet, devnet, localnet

# ================================
# EMAIL CONFIGURATION (Optional)
# ================================
MAILTRAP_USER=your-mailtrap-username
MAILTRAP_PASS=your-mailtrap-password
EMAIL_FROM=noreply@labsharedao.com
```

### DAO Contract Deployment Configuration

The DAO smart contract is already deployed on Sui Devnet:
- **Package ID**: `0x1c614ad1b86318b4b0360fb9296e89caf5c7648c8710d9c358e1aa8ad3f8c3ed`
- **Network**: Sui Devnet
- **Transaction**: `GkAuq7GgVPaFCA7vgcnb1M1iKVq9tcV66vrPzWrQrec`

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

```bash
# Install MongoDB locally or use MongoDB Atlas
# Create database: labshare_dao
# The application will automatically create required collections
```

### 3. Initialize DAO (First Time Setup)

After setting environment variables, initialize the DAO:

```bash
# Start the server
npm run dev

# Call the initialization endpoint
curl -X POST http://localhost:5000/api/dao/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LabShareDAO",
    "description": "Decentralized research laboratory collaboration platform",
    "adminAddress": "0x848832ddf5db118a1c11050e9bfa33b3a63206c6371e344c928917e08a450233"
  }'
```

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication
Most endpoints require JWT authentication via:
- Header: `Authorization: Bearer <token>`
- Cookie: `token=<jwt-token>`

### Core Endpoints

#### DAO Information
- `GET /dao/info` - Get DAO information
- `GET /dao/dashboard` - Get dashboard statistics
- `GET /dao/health` - Health check

#### Member Management
- `POST /dao/members/link-address` - Link Sui address to user account
- `POST /dao/admin/members` - Add new member (Admin only)
- `GET /dao/members` - List all members
- `GET /dao/members/:address` - Get member details
- `GET /dao/user/status` - Get current user's DAO status

#### Data Submission
- `POST /dao/data` - Submit sensor data
- `GET /dao/data` - Get data records (with filtering)
- `GET /dao/data/:recordId` - Get specific data record

#### Proposals & Voting
- `POST /dao/proposals` - Create new proposal
- `GET /dao/proposals` - List proposals (with filtering)
- `GET /dao/proposals/:proposalId` - Get proposal details
- `POST /dao/proposals/:proposalId/vote` - Vote on proposal
- `POST /dao/proposals/:proposalId/execute` - Execute proposal

#### Admin Functions
- `PUT /dao/admin/thresholds/:sensorTypeId` - Update sensor thresholds
- `GET /dao/thresholds` - Get threshold configurations
- `GET /dao/sensor-types` - Get available sensor types

#### Treasury
- `POST /dao/treasury/add-funds` - Add funds to treasury
- `GET /dao/treasury/balance` - Get treasury balance

#### Event Management
- `GET /dao/events/status` - Get event listener status
- `POST /dao/admin/events/start` - Start event listener
- `POST /dao/admin/events/stop` - Stop event listener
- `POST /dao/admin/events/sync` - Manually sync events

## Database Schema

### Collections Created
- `daousermappings` - Links users to Sui addresses
- `daoinfos` - DAO configuration and statistics
- `sensortypes` - Available sensor types
- `thresholdconfigs` - Sensor threshold configurations
- `proposals` - DAO proposals and voting data
- `datarecords` - Sensor data submissions

### Default Data
The system automatically creates:
- 4 default sensor types (Temperature, Humidity, Pressure, Luminosity)
- Default threshold configurations for each sensor type

## Blockchain Integration

### Event Synchronization
The system automatically:
- Listens to blockchain events in real-time
- Syncs all DAO activities to MongoDB
- Handles reconnections and missed events
- Provides manual sync capabilities

### Supported Operations
- Member management
- Data submission with automatic alerting
- Proposal creation and voting
- Treasury management
- Threshold configuration

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Test database connection
npm run test:db

# Test email configuration
npm run test:email

# Check environment variables
npm run check:env
```

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production MongoDB URL
3. Configure proper JWT secret
4. Set up proper CORS origins
5. Use production Sui network (mainnet/testnet)

### Security Considerations
- Use strong JWT secrets
- Implement rate limiting
- Set up proper CORS policies
- Use HTTPS in production
- Monitor for unusual activity

### Monitoring
- Health check endpoint: `/health`
- Event listener status: `/api/dao/events/status`
- Database connection monitoring
- Error logging and alerting

## Troubleshooting

### Common Issues

1. **DAO not initialized**
   - Ensure `SUI_PACKAGE_ID` and `DAO_OBJECT_ID` are set
   - Call the initialization endpoint once

2. **Event listener not working**
   - Check Sui network connectivity
   - Verify package ID and DAO object ID
   - Restart event listener via API

3. **Transaction failures**
   - Ensure users have sufficient SUI for gas
   - Check wallet connection
   - Verify contract permissions

4. **Database connection issues**
   - Check MongoDB URL and credentials
   - Ensure database server is running
   - Verify network connectivity

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

### Logs
Monitor console output for:
- Event processing status
- Database operations
- Blockchain interactions
- Authentication attempts

## Support & Documentation

For additional help:
- Check console logs for detailed error messages
- Use the health check endpoint to verify system status
- Review MongoDB collections for data integrity
- Test individual API endpoints using the provided examples

## Version Information
- Backend API Version: 1.0.0
- Sui SDK Version: Latest compatible
- MongoDB Driver: 8.15.0+
- Express.js: 5.1.0+ 