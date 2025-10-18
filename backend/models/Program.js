const mongoose = require('mongoose');

const programWorkoutSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    required: true
  },
  week: {
    type: Number,
    required: true,
    min: 1
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
});

const daySchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true,
    min: 1
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  workouts: [programWorkoutSchema]
});

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  assignedTo: {
    tiers: [String],
    users: [String]
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  },
  stats: {
    completions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  days: [daySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Program', programSchema);
