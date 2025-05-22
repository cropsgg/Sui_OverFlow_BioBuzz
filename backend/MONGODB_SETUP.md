# MongoDB Setup and Troubleshooting Guide

This guide will help you properly set up and configure MongoDB for the BioBuzz application.

## Prerequisites

- MongoDB installed on your system
- Node.js and npm installed

## Setup Instructions

### 1. Install MongoDB

If you haven't installed MongoDB yet, follow the official installation guide for your operating system:
- [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

### 2. Configure MongoDB Connection

Create a `.env` file in the backend directory with the following MongoDB configuration:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/biobuzz
```

If your MongoDB requires authentication, use the following format:

```
MONGODB_URI=mongodb://username:password@localhost:27017/biobuzz
```

### 3. Test the MongoDB Connection

Run the database test script to verify your connection:

```bash
npm run test:db
```

This will show detailed information about your MongoDB connection status.

## Starting MongoDB

### On Linux:
```bash
sudo systemctl start mongod
```

### On macOS (with Homebrew):
```bash
brew services start mongodb-community
```

### On Windows:
MongoDB should be running as a service, or you can start it from the MongoDB Compass application.

## Troubleshooting MongoDB Connection Issues

### Common Issues:

1. **MongoDB Not Running**
   - Check if MongoDB service is running:
     ```bash
     # Linux
     sudo systemctl status mongod
     
     # macOS
     brew services list | grep mongodb
     ```

2. **Connection Refused**
   - Ensure MongoDB is listening on the expected port (default 27017):
     ```bash
     # Check if MongoDB is listening on port 27017
     netstat -tuln | grep 27017
     ```

3. **Authentication Issues**
   - Verify your username and password if using authentication
   - Check if MongoDB is running with authentication enabled

4. **Database Permissions**
   - Ensure your MongoDB user has the correct permissions to access the database

5. **Network Issues**
   - If connecting to a remote MongoDB, check firewall settings
   - Verify the hostname is correct and resolves properly

### Debugging Steps:

1. Test a simple connection with the MongoDB shell:
   ```bash
   mongosh "mongodb://localhost:27017/biobuzz"
   ```

2. Check MongoDB logs for errors:
   ```bash
   # Linux
   sudo cat /var/log/mongodb/mongod.log | grep error
   
   # Custom log location
   cat /path/to/mongodb.log | grep error
   ```

3. Run our test script with additional debugging:
   ```bash
   DEBUG=mongoose:* npm run test:db
   ```

## Database Initialization

The BioBuzz application will automatically create required collections when it first runs. No manual database setup is needed beyond ensuring MongoDB is running properly.

## Need More Help?

If you're still experiencing issues, check the [MongoDB documentation](https://docs.mongodb.com/) or open an issue in our project repository. 