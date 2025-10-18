import mongoose from 'mongoose';

const WorkoutExerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  sets: {
    type: Number,
    required: true,
    min: [1, 'Sets must be at least 1'],
    max: [20, 'Sets cannot exceed 20']
  },
  reps: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'Reps cannot exceed 20 characters']
  },
  restTime: {
    type: Number,
    default: 60,
    min: [0, 'Rest time cannot be negative'],
    max: [600, 'Rest time cannot exceed 600 seconds']
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
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tempo: {
    type: String,
    trim: true,
    maxlength: [20, 'Tempo cannot exceed 20 characters']
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Order must be at least 1']
  }
});

const WorkoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Workout title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  exercises: [WorkoutExerciseSchema],
  duration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute'],
    max: [300, 'Duration cannot exceed 300 minutes']
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative'],
    max: [2000, 'Calories cannot exceed 2000']
  },
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
WorkoutSchema.index({ title: 'text', description: 'text' });
WorkoutSchema.index({ difficulty: 1 });
WorkoutSchema.index({ status: 1 });
WorkoutSchema.index({ 'assignedTo.tiers': 1 });
WorkoutSchema.index({ 'assignedTo.users': 1 });
WorkoutSchema.index({ createdAt: -1 });

export default mongoose.models.Workout || mongoose.model('Workout', WorkoutSchema);
