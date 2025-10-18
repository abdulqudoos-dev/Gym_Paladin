const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  reps: { type: Number },
  weight: { type: Number },
  restTime: { type: Number },
  // Keep the hidden prescription percentage (not shown to end users)
  percent: { type: Number },
  completedAt: { type: Date },
  notes: { type: String },
  isCompleted: { type: Boolean, default: false }
});

const exerciseInSessionSchema = new mongoose.Schema({
  exerciseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exercise',
    required: true 
  },
  exerciseName: { type: String },
  order: { type: Number },
  sets: [setSchema],
  maxType: { type: String, enum: ['1RM', '3RM', '5RM', '10RM', 'RM'], default: '1RM' },
  isCompleted: { type: Boolean, default: false },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

const programSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  programId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program', 
    required: true 
  },
  week: { type: Number, required: true },
  day: { type: Number, required: true },
  sessionId: { type: String, required: true }, // Unique session identifier
  
  // Session Status
  status: { 
    type: String, 
    enum: ['preparing', 'active', 'paused', 'completed', 'cancelled'],
    default: 'preparing'
  },
  
  // Timing
  startedAt: { type: Date, default: Date.now },
  pausedAt: { type: Date },
  resumedAt: { type: Date },
  completedAt: { type: Date },
  totalDuration: { type: Number, default: 0 }, // Total active time in seconds
  pausedDuration: { type: Number, default: 0 }, // Total paused time in seconds
  
  // Progress Tracking
  currentWorkoutIndex: { type: Number, default: 0 },
  currentExerciseIndex: { type: Number, default: 0 },
  currentSetIndex: { type: Number, default: 0 },
  exercisesCompleted: { type: Number, default: 0 },
  totalExercises: { type: Number, required: true },
  
  // Calories & Stats
  caloriesBurned: { type: Number, default: 0 },
  totalReps: { type: Number, default: 0 },
  totalSets: { type: Number, default: 0 },
  
  // Exercise Details
  exercises: [exerciseInSessionSchema],
  
  // User Experience
  notes: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  difficulty: { type: String }, // User's perceived difficulty
  
  // Achievements
  achievements: [{ type: String }], // Badges earned during workout
  personalRecords: [{ 
    exerciseId: mongoose.Schema.Types.ObjectId,
    recordType: String, // 'max_weight', 'max_reps', 'fastest_time'
    value: Number,
    previousValue: Number
  }]
}, {
  timestamps: true
});

// Indexes for better performance
programSessionSchema.index({ userId: 1, createdAt: -1 });
programSessionSchema.index({ sessionId: 1 });
programSessionSchema.index({ status: 1 });

// UNIQUE INDEX TO PREVENT DUPLICATE SESSIONS
// Only one active session per user per workout
programSessionSchema.index(
  { 
    userId: 1, 
    programId: 1, 
    week: 1, 
    day: 1, 
    currentWorkoutIndex: 1, 
    status: 1 
  },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['preparing', 'active', 'paused'] } 
    },
    name: 'unique_active_session_per_workout'
  }
);

module.exports = mongoose.model('ProgramSession', programSessionSchema);
