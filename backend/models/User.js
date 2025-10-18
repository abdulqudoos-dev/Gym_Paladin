const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if Google user
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: ''
  },
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true, // Allows null values but ensures uniqueness when present
    unique: true
  },
  googleEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  googleName: {
    type: String,
    trim: true
  },
  googlePicture: {
    type: String,
    default: ''
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  lastGoogleSignIn: {
    type: Date,
    default: null
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'foundations', 'advanced', 'custom'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
      default: 'inactive'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    payhipCustomerId: {
      type: String,
      default: null
    },
    payhipSubscriptionId: {
      type: String,
      default: null
    },
    payhipProductId: {
      type: String,
      default: null
    },
    currentPeriodStart: {
      type: Date,
      default: null
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  assignedProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null
  },
  profile: {
    age: {
      type: Number,
      min: [13, 'Age must be at least 13'],
      max: [100, 'Age cannot exceed 100']
    },
    height: {
      type: Number, // in cm
      min: [100, 'Height must be at least 100cm'],
      max: [250, 'Height cannot exceed 250cm']
    },
    weight: {
      type: Number, // in kg
      min: [30, 'Weight must be at least 30kg'],
      max: [300, 'Weight cannot exceed 300kg']
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    goals: [{
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness']
    }]
  },
  stats: {
    totalWorkouts: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastWorkoutDate: {
      type: Date,
      default: null
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's initials for avatar
userSchema.methods.getInitials = function() {
  return this.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Virtual for user's full profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const fields = ['age', 'height', 'weight', 'fitnessLevel', 'goals'];
  const completedFields = fields.filter(field => {
    if (field === 'goals') return this.profile.goals && this.profile.goals.length > 0;
    return this.profile[field];
  }).length;
  
  return Math.round((completedFields / fields.length) * 100);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
