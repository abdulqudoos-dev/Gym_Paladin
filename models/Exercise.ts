import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body'],
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Video URL must be a valid URL'
    }
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid URL'
    }
  },
  defaultSets: {
    type: Number,
    default: 3,
    min: [1, 'Default sets must be at least 1'],
    max: [20, 'Default sets cannot exceed 20']
  },
  defaultReps: {
    type: String,
    default: '10-12',
    trim: true,
    maxlength: [20, 'Default reps cannot exceed 20 characters']
  },
  defaultRest: {
    type: Number,
    default: 60,
    min: [0, 'Default rest time cannot be negative'],
    max: [600, 'Default rest time cannot exceed 600 seconds']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isCustom: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
ExerciseSchema.index({ name: 'text', description: 'text' });
ExerciseSchema.index({ category: 1 });
ExerciseSchema.index({ tags: 1 });
ExerciseSchema.index({ createdAt: -1 });

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
