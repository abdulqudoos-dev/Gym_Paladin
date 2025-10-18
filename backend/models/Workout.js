const mongoose = require('mongoose');

const exerciseInWorkoutSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: String,
    default: ''
  },
  restTime: {
    type: Number,
    default: 60,
    min: 0
  },
  // Optional: advanced per-set prescription. When provided, this takes precedence
  // over the aggregate fields above when generating sessions.
  setScheme: [{
    percent: { type: Number }, // 0-1 or 0-100; interpretation handled in routes
    reps: { type: Number },
    restTime: { type: Number, min: 0 }
  }],
  // Which max to use when calculating weights from percentages
  maxType: {
    type: String,
    enum: ['1RM', '3RM', '5RM', '10RM', 'RM'],
    default: '1RM'
  },
  notes: {
    type: String,
    default: ''
  },
  tempo: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
});

const workoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: Number,
    default: 30
  },
  calories: {
    type: Number,
    default: 0
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
  exercises: [exerciseInWorkoutSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);