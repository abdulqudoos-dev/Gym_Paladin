# FitMaker - Complete Setup Guide

This guide will help you set up the complete FitMaker fitness application with frontend (Next.js) and backend (Node.js + MongoDB) integration.

## 🏗️ Project Structure

```
GYM/
├── app/                    # Next.js App Router (Frontend)
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   └── forgot-password/ # Password reset page
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Pricing page
│   ├── api/               # API routes (proxy to backend)
│   └── ...
├── components/            # Reusable React components
├── public/               # Static assets
├── backend/              # Node.js Backend API
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
└── ...
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Frontend Setup (Next.js)

```bash
# Navigate to project root
cd GYM

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3001`

### 2. Backend Setup (Node.js + MongoDB)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your configuration
# (See Backend Configuration section below)

# Start backend server
npm run dev
```

The backend API will be available at `http://localhost:5000`

## ⚙️ Configuration

### Frontend Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

### Backend Environment Variables

Edit the `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/fitmaker
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/fitmaker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d

# Email Configuration (for password reset)
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

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/fitmaker` as MONGODB_URI

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Use the connection string as MONGODB_URI

## 📧 Email Configuration (Optional)

For password reset functionality:

1. **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password as EMAIL_PASS

2. **Other Email Providers:**
   - Update EMAIL_HOST and EMAIL_PORT accordingly
   - Use appropriate authentication credentials

## 🔐 Authentication Flow

### User Registration
1. User fills signup form → `/auth/signup`
2. Frontend sends data to `/api/auth/signup`
3. Backend creates user in MongoDB
4. JWT token returned to frontend
5. User redirected to pricing page

### User Login
1. User fills login form → `/auth/login`
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates credentials
4. JWT token returned to frontend
5. User redirected to dashboard

### Password Reset
1. User requests password reset → `/auth/forgot-password`
2. Backend generates reset token
3. Email sent with reset link
4. User clicks link and resets password

## 🎨 Features Implemented

### Frontend Features
- ✅ **Professional Authentication Pages**
  - Modern, responsive design
  - Form validation with error handling
  - Smooth animations and transitions
  - Social login buttons (UI only)

- ✅ **User Dashboard**
  - Welcome message with user data
  - Fitness stats overview
  - Quick action buttons
  - Recent activity section

- ✅ **Responsive Design**
  - Mobile-first approach
  - Consistent theme across pages
  - Professional UI components

### Backend Features
- ✅ **Authentication System**
  - User registration and login
  - JWT token authentication
  - Password hashing with bcrypt
  - Password reset functionality

- ✅ **User Management**
  - Profile management
  - Subscription tracking
  - Fitness stats tracking
  - Account deactivation

- ✅ **Security Features**
  - Rate limiting
  - Input validation
  - CORS configuration
  - Security headers

## 🔗 API Integration

The frontend communicates with the backend through API routes:

```
Frontend → /api/auth/* → Backend /api/auth/*
```

Example flow:
1. User submits login form
2. Frontend calls `/api/auth/login`
3. Next.js API route forwards to backend
4. Backend processes and returns response
5. Frontend handles response

## 🧪 Testing the Setup

### 1. Test Frontend
```bash
# Start frontend
npm run dev

# Visit http://localhost:3001
# Test navigation and UI
```

### 2. Test Backend
```bash
# Start backend
cd backend
npm run dev

# Test health endpoint
curl http://localhost:5000/api/health
```

### 3. Test Authentication
1. Go to `http://localhost:3001/auth/signup`
2. Create a new account
3. Check MongoDB for new user document
4. Try logging in at `http://localhost:3001/auth/login`
5. Access dashboard at `http://localhost:3001/dashboard`

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Backend Deployment (Railway/Heroku)

1. Push backend code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Update MONGODB_URI in production
3. Configure network access
4. Set up database users

## 🛠️ Development Tips

### Adding New Features

1. **Frontend:**
   - Create new page in `app/`
   - Add components in `components/`
   - Update navigation in `Header.tsx`

2. **Backend:**
   - Create model in `backend/models/`
   - Add routes in `backend/routes/`
   - Update middleware if needed

### Debugging

1. **Frontend Issues:**
   - Check browser console
   - Verify API calls in Network tab
   - Check Next.js terminal output

2. **Backend Issues:**
   - Check server terminal output
   - Verify MongoDB connection
   - Test API endpoints with Postman

## 📱 Mobile Responsiveness

The application is fully responsive and tested on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## 🔒 Security Considerations

- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- Rate limiting prevents brute force attacks
- CORS is configured for frontend domain
- Input validation on all forms

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Check MONGODB_URI format
   - Verify MongoDB is running
   - Check network access (for Atlas)

2. **JWT Token Issues:**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure token is sent in Authorization header

3. **Email Not Sending:**
   - Check email credentials
   - Verify SMTP settings
   - Check spam folder

4. **Frontend-Backend Connection:**
   - Verify BACKEND_URL in frontend
   - Check CORS configuration
   - Ensure both servers are running

## 📞 Support

If you encounter any issues:

1. Check this setup guide
2. Review error messages in console
3. Verify all environment variables
4. Test each component individually

## 🎯 Next Steps

After successful setup, you can:

1. Customize the UI design
2. Add more workout features
3. Implement payment integration
4. Add more user profile fields
5. Create workout programs
6. Add social features

---

**Happy coding! 🚀**
