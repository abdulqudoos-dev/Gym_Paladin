const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  earnedAt: Date,
  category: String // 'workout', 'streak', 'program', 'personal_record'
});

const personalRecordSchema = new mongoose.Schema({
  exerciseId: mongoose.Schema.Types.ObjectId,
  exerciseName: String,
  recordType: String,
  value: Number,
  achievedAt: Date,
  workoutId: mongoose.Schema.Types.ObjectId
});

const weeklyStatsSchema = new mongoose.Schema({
  week: String, // '2024-W01'
  workouts: Number,
  duration: Number,
  calories: Number
});

const monthlyStatsSchema = new mongoose.Schema({
  month: String, // '2024-01'
  workouts: Number,
  duration: Number,
  calories: Number
});

const userStatsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Overall Stats
  totalWorkouts: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in minutes
  totalCalories: { type: Number, default: 0 },
  totalReps: { type: Number, default: 0 },
  totalSets: { type: Number, default: 0 },
  
  // Streaks
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastWorkoutDate: { type: Date },
  
  // XP System
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xpToNextLevel: { type: Number, default: 100 },
  
  // Achievements
  achievements: [achievementSchema],
  
  // Personal Records
  personalRecords: [personalRecordSchema],
  
  // Weekly/Monthly Stats
  weeklyStats: [weeklyStatsSchema],
  monthlyStats: [monthlyStatsSchema]
}, {
  timestamps: true
});

// Indexes for better performance
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ totalXP: -1 });
userStatsSchema.index({ currentStreak: -1 });

// Virtual for XP progress percentage
userStatsSchema.virtual('xpProgress').get(function() {
  const currentLevelXP = (this.level - 1) * 100;
  const xpInCurrentLevel = this.totalXP - currentLevelXP;
  return Math.round((xpInCurrentLevel / 100) * 100);
});

// Ensure virtual fields are serialized
userStatsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserStats', userStatsSchema);
