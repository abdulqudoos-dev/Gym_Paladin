const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body', 'strength', 'sports']
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  // Arrays for multiple media
  videoUrls: {
    type: [String],
    default: []
  },
  imageUrls: {
    type: [String],
    default: []
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  animationUrl: {
    type: String,
    default: '' // GIF or short video for exercise demonstration
  },
  defaultSets: {
    type: Number,
    default: 3
  },
  defaultReps: {
    type: String,
    default: '10-12'
  },
  defaultRest: {
    type: Number,
    default: 60 // in seconds
  },
  caloriesPerMinute: {
    type: Number,
    default: 8 // Estimated calories burned per minute
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  equipment: [{
    type: String,
    trim: true
  }],
  muscleGroups: [{
    type: String,
    trim: true
  }],
  formTips: [{
    type: String,
    trim: true
  }],
  commonMistakes: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isCustom: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exercise', exerciseSchema);
