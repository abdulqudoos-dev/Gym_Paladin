const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
console.log('🔧 Passport Configuration Debug:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', profile);
    
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      // Update last Google sign-in
      existingUser.lastGoogleSignIn = new Date();
      await existingUser.save();
      return done(null, existingUser);
    }
    
    // Check if user exists with same email
    const userWithEmail = await User.findOne({ email: profile.emails[0].value });
    
    if (userWithEmail) {
      // Link Google account to existing user
      userWithEmail.googleId = profile.id;
      userWithEmail.googleEmail = profile.emails[0].value;
      userWithEmail.googleName = profile.displayName;
      userWithEmail.googlePicture = profile.photos[0]?.value || '';
      userWithEmail.isGoogleUser = true;
      userWithEmail.lastGoogleSignIn = new Date();
      await userWithEmail.save();
      return done(null, userWithEmail);
    }
    
    // Create new user
    const newUser = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      googleEmail: profile.emails[0].value,
      googleName: profile.displayName,
      googlePicture: profile.photos[0]?.value || '',
      isGoogleUser: true,
      lastGoogleSignIn: new Date(),
      emailVerified: true, // Google emails are pre-verified
      avatar: profile.photos[0]?.value || '',
      subscription: {
        plan: 'free',
        status: 'inactive'
      },
      profile: {
        age: null,
        height: null,
        weight: null,
        fitnessLevel: 'beginner',
        goals: []
      },
      stats: {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null
      }
    });
    
    await newUser.save();
    console.log('New Google user created:', newUser.email);
    return done(null, newUser);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
