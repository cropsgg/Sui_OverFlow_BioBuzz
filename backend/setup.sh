#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== BioBuzz Backend Setup ===${NC}"

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    
    # Check if .env.example exists
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created. Please update it with your configuration${NC}"
    else
        echo -e "${RED}✗ .env.example not found. Creating a basic .env file...${NC}"
        cat > .env << EOL
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/biobuzz

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRE=7

# Email Configuration (Mailtrap)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_username
EMAIL_PASS=your_mailtrap_password
EMAIL_FROM=noreply@biobuzz.io

# Frontend URL
CLIENT_URL=http://localhost:3000
EOL
        echo -e "${GREEN}✓ Basic .env file created. Please update it with your configuration${NC}"
    fi
fi

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies are installed${NC}"
else
    echo -e "${YELLOW}⚠ Dependencies not found. Installing...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Check MongoDB connection
echo -e "${YELLOW}Testing MongoDB connection...${NC}"
npm run test:db

# Check environment configuration
echo -e "${YELLOW}Checking environment configuration...${NC}"
npm run check:env

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo -e "${YELLOW}You can now start the application with:${NC} npm run dev" 