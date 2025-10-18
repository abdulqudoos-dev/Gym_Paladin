# FitMaker Backend API

A robust Node.js backend API for the FitMaker fitness application, built with Express.js and MongoDB.

## Features

- 🔐 **Authentication & Authorization**
  - User registration and login
  - JWT token-based authentication
  - Password reset functionality
  - Protected routes middleware

- 👤 **User Management**
  - User profile management
  - Subscription tracking
  - Fitness stats tracking
  - Account deactivation

- 🏋️ **Workout System**
  - Workout tracking
  - Progress monitoring
  - Subscription-based program access

- 📧 **Email Services**
  - Password reset emails
  - Account verification
  - Notification system

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/fitmaker
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /signup` - User registration
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /forgot-password` - Request password reset
- `PUT /reset-password/:token` - Reset password
- `PUT /update-password` - Update password

### User Routes (`/api/users`)

- `PUT /profile` - Update user profile
- `PUT /subscription` - Update subscription
- `GET /stats` - Get user stats
- `PUT /stats` - Update user stats
- `DELETE /account` - Delete account

### Workout Routes (`/api/workouts`)

- `GET /` - Get user workouts
- `GET /:id` - Get workout by ID
- `POST /start` - Start workout session
- `POST /complete` - Complete workout
- `GET /programs` - Get workout programs (requires subscription)

## Database Schema

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  subscription: {
    plan: String, // 'free', 'foundations', 'advanced', 'custom'
    status: String, // 'active', 'inactive', 'cancelled'
    startDate: Date,
    endDate: Date
  },
  profile: {
    age: Number,
    height: Number,
    weight: Number,
    fitnessLevel: String,
    goals: [String]
  },
  stats: {
    totalWorkouts: Number,
    currentStreak: Number,
    longestStreak: Number,
    lastWorkoutDate: Date
  }
}
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Express validator for all inputs

## Development

### Project Structure

```
backend/
├── models/          # MongoDB models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Adding New Features

1. Create model in `models/`
2. Add routes in `routes/`
3. Update middleware if needed
4. Test endpoints

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitmaker
JWT_SECRET=your-production-secret-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
