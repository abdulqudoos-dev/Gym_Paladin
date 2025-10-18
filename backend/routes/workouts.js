const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, requireSubscription } = require('../middleware/auth');
const Workout = require('../models/Workout');

const router = express.Router();

// @desc    Get all workouts
// @route   GET /api/workouts
// @access  Public (for workout planner)
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find()
      .populate('exercises.exerciseId', 'name category description defaultSets defaultReps defaultRest tags')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      workouts
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Get workout by ID
// @route   GET /api/workouts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await Workout.findById(id).populate('exercises.exerciseId');
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    res.json({
      success: true,
      workout
    });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Create new workout
// @route   POST /api/workouts
// @access  Public (for workout planner)
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const workout = new Workout(req.body);
    await workout.save();
    
    // Populate the exercise data before returning
    const populatedWorkout = await Workout.findById(workout._id).populate('exercises.exerciseId', 'name category description defaultSets defaultReps defaultRest tags');
    
    res.status(201).json({
      success: true,
      workout: populatedWorkout
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Public (for workout planner)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await Workout.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('exercises.exerciseId');
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    res.json({
      success: true,
      workout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Public (for workout planner)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await Workout.findByIdAndDelete(id);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }

    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Start workout
// @route   POST /api/workouts/start
// @access  Private
router.post('/start', protect, [
  body('workoutId')
    .notEmpty()
    .withMessage('Workout ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { workoutId } = req.body;

    // Mock workout session
    const session = {
      id: `session_${Date.now()}`,
      workoutId,
      userId: req.user._id,
      startTime: new Date(),
      status: 'active'
    };

    res.json({
      success: true,
      message: 'Workout started',
      session
    });
  } catch (error) {
    console.error('Start workout error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Complete workout
// @route   POST /api/workouts/complete
// @access  Private
router.post('/complete', protect, [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('calories')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Calories must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId, duration, calories } = req.body;

    // Update user stats
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    user.stats.totalWorkouts += 1;
    user.stats.lastWorkoutDate = new Date();
    
    // Update streak logic
    const today = new Date();
    const lastWorkout = user.stats.lastWorkoutDate;
    
    if (lastWorkout) {
      const daysDiff = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.stats.currentStreak += 1;
      } else if (daysDiff > 1) {
        user.stats.currentStreak = 1;
      }
    } else {
      user.stats.currentStreak = 1;
    }
    
    if (user.stats.currentStreak > user.stats.longestStreak) {
      user.stats.longestStreak = user.stats.currentStreak;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Workout completed successfully',
      stats: user.stats
    });
  } catch (error) {
    console.error('Complete workout error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Get workout programs (requires subscription)
// @route   GET /api/workouts/programs
// @access  Private
router.get('/programs', protect, requireSubscription('foundations'), async (req, res) => {
  try {
    // Mock programs data
    const programs = [
      {
        id: '1',
        name: 'Foundation Strength',
        description: 'Build fundamental strength with basic movements',
        duration: '8 weeks',
        difficulty: 'beginner',
        workouts: 24,
        plan: 'foundations'
      },
      {
        id: '2',
        name: 'Advanced Powerlifting',
        description: 'Master the big three lifts with advanced techniques',
        duration: '12 weeks',
        difficulty: 'advanced',
        workouts: 36,
        plan: 'advanced'
      }
    ];

    res.json({
      success: true,
      programs
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;
