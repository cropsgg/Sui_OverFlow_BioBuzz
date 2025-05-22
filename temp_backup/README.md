# BioBuzz Backend

## Description
Backend API for BioBuzz with complete JWT-based authentication system including email verification, password reset, and profile management.

## Features
- User registration with email verification
- Login/logout functionality
- JWT authentication
- Password reset via email
- Change password functionality
- Profile management
- Account deletion

## Tech Stack
- Node.js
- Express.js
- TypeScript
- MongoDB/Mongoose
- JWT for authentication
- Nodemailer for email services
- Express Validator for input validation

## Prerequisites
- Node.js (v14 or higher)
- MongoDB

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Sui_OverFlow_BioBuzz/backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory based on `.env.example`

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/biobuzz
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
CLIENT_URL=http://localhost:3000
```

4. Start the development server
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/change-password` - Change password

### User
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users` - Delete user account

## Build For Production

```bash
npm run build
npm start
```

## License
[MIT](LICENSE) 