import mongoose from 'mongoose';

const ProgramWorkoutSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    required: true
  },
  week: {
    type: Number,
    required: true,
    min: [1, 'Week must be at least 1']
  },
  day: {
    type: Number,
    required: true,
    min: [1, 'Day must be at least 1'],
    max: [7, 'Day cannot exceed 7']
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Order must be at least 1']
  }
});

const ProgramDaySchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true,
    min: [1, 'Week must be at least 1']
  },
  day: {
    type: Number,
    required: true,
    min: [1, 'Day must be at least 1'],
    max: [7, 'Day cannot exceed 7']
  },
  workouts: {
    type: [ProgramWorkoutSchema],
    default: []
  }
});

const ProgramSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Program title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: {
    type: Number, // in days
    required: true,
    min: [1, 'Duration must be at least 1 day'],
    max: [365, 'Duration cannot exceed 365 days']
  },
  days: [ProgramDaySchema],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  assignedTo: {
    tiers: [{
      type: String,
      enum: ['foundations', 'advanced', 'custom']
    }],
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: {
    completions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
ProgramSchema.index({ title: 'text', description: 'text' });
ProgramSchema.index({ difficulty: 1 });
ProgramSchema.index({ status: 1 });
ProgramSchema.index({ 'assignedTo.tiers': 1 });
ProgramSchema.index({ 'assignedTo.users': 1 });
ProgramSchema.index({ createdAt: -1 });

export default mongoose.models.Program || mongoose.model('Program', ProgramSchema);
