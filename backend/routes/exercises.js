const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Exercise = require('../models/Exercise');

const router = express.Router();

// @desc    Get all exercises
// @route   GET /api/exercises
// @access  Public (for workout planner)
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    console.log('Retrieved exercises count:', exercises.length);
    if (exercises.length > 0) {
      console.log('Sample exercise URLs:', {
        name: exercises[0].name,
        videoUrl: exercises[0].videoUrl,
        imageUrl: exercises[0].imageUrl
      });
    }
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get exercise by ID
// @route   GET /api/exercises/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new exercise
// @route   POST /api/exercises
// @access  Public (for workout planner)
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').isIn(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body', 'strength']).withMessage('Invalid category'),
  body('description').notEmpty().withMessage('Description is required'),
  body('defaultSets').isInt({ min: 1 }).withMessage('Default sets must be at least 1'),
  body('defaultReps').notEmpty().withMessage('Default reps is required'),
  body('defaultRest').isInt({ min: 0 }).withMessage('Default rest time must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Coerce media fields (supports single value or arrays)
    const coerceToArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

    const exerciseData = {
      ...req.body,
      videoUrls: coerceToArray(req.body.videoUrls || req.body.videoUrl),
      imageUrls: coerceToArray(req.body.imageUrls || req.body.imageUrl),
      createdBy: 'admin'
    };

    console.log('Creating exercise with data:', exerciseData);
    console.log('Video URL:', exerciseData.videoUrl);
    console.log('Image URL:', exerciseData.imageUrl);
    
    const exercise = new Exercise(exerciseData);
    await exercise.save();
    
    console.log('Exercise created successfully:', exercise);
    console.log('Saved Video URL:', exercise.videoUrl);
    console.log('Saved Image URL:', exercise.imageUrl);
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @desc    Update exercise
// @route   PUT /api/exercises/:id
// @access  Public (for workout planner)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating exercise:', id, 'with data:', JSON.stringify(req.body, null, 2));
    
    // Remove createdBy from update data to avoid validation issues
    const { createdBy, ...updateData } = req.body;
    
    // Ensure proper data types & coerce media fields
    const coerceToArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));
    updateData.videoUrls = coerceToArray(updateData.videoUrls || updateData.videoUrl);
    updateData.imageUrls = coerceToArray(updateData.imageUrls || updateData.imageUrl);
    delete updateData.videoUrl;
    delete updateData.imageUrl;
    if (updateData.defaultSets) {
      updateData.defaultSets = parseInt(updateData.defaultSets);
    }
    if (updateData.defaultRest) {
      updateData.defaultRest = parseInt(updateData.defaultRest);
    }
    
    console.log('Update data after processing:', updateData);
    console.log('Video URL:', updateData.videoUrl);
    console.log('Image URL:', updateData.imageUrl);
    
    // Merge media arrays with existing to avoid accidental overwrite
    const existing = await Exercise.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
    const mergedImageUrls = uniq([...(existing.imageUrls || []), ...(existing.imageUrl ? [existing.imageUrl] : []), ...(updateData.imageUrls || [])]);
    const mergedVideoUrls = uniq([...(existing.videoUrls || []), ...(existing.videoUrl ? [existing.videoUrl] : []), ...(updateData.videoUrls || [])]);

    updateData.imageUrls = mergedImageUrls;
    updateData.videoUrls = mergedVideoUrls;

    const exercise = await Exercise.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    console.log('Exercise updated successfully:', exercise);
    console.log('Final Video URL in DB:', exercise.videoUrl);
    console.log('Final Image URL in DB:', exercise.imageUrl);
    res.json(exercise);
  } catch (error) {
    console.error('Update exercise error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @desc    Delete exercise
// @route   DELETE /api/exercises/:id
// @access  Public (for workout planner)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findByIdAndDelete(id);
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Remove a specific media URL from an exercise
// @route   DELETE /api/exercises/:id/media
// @access  Public (admin UI path)
router.delete('/:id/media', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, kind } = req.body || {};
    if (!url || !kind || !['image', 'video'].includes(kind)) {
      return res.status(400).json({ message: 'url and kind (image|video) are required' });
    }

    const exercise = await Exercise.findById(id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    if (kind === 'image') {
      exercise.imageUrls = (exercise.imageUrls || []).filter(u => u !== url);
      if (exercise.imageUrl === url) exercise.imageUrl = '';
    } else {
      exercise.videoUrls = (exercise.videoUrls || []).filter(u => u !== url);
      if (exercise.videoUrl === url) exercise.videoUrl = '';
    }

    await exercise.save();
    res.json({ success: true, exercise });
  } catch (error) {
    console.error('Remove media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;