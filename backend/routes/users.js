const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Program = require('../models/Program');
const programAssignmentService = require('../services/programAssignmentService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.q || '';
    const status = req.query.status || '';
    const plan = req.query.plan || '';

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter['subscription.status'] = status;
    }
    
    if (plan && plan !== 'all') {
      filter['subscription.plan'] = plan;
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('assignedProgram', 'title description duration difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total: total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Admin update user (name, email, subscription, isActive)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this resource' });
    }

    const userId = req.params.id;
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.email !== undefined) update.email = req.body.email;
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive;
    if (req.body.subscription) {
      if (req.body.subscription.plan !== undefined) update['subscription.plan'] = req.body.subscription.plan;
      if (req.body.subscription.status !== undefined) update['subscription.status'] = req.body.subscription.status;
      if (req.body.subscription.startDate !== undefined) update['subscription.startDate'] = req.body.subscription.startDate;
      if (req.body.subscription.endDate !== undefined) update['subscription.endDate'] = req.body.subscription.endDate;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 100 })
    .withMessage('Age must be between 13 and 100'),
  body('height')
    .optional()
    .isInt({ min: 100, max: 250 })
    .withMessage('Height must be between 100cm and 250cm'),
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Weight must be between 30kg and 300kg'),
  body('fitnessLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Fitness level must be beginner, intermediate, or advanced'),
  body('goals')
    .optional()
    .isArray()
    .withMessage('Goals must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {};
    
    // Update basic info
    if (req.body.name) updateData.name = req.body.name;
    
    // Update profile info
    if (req.body.age !== undefined) updateData['profile.age'] = req.body.age;
    if (req.body.height !== undefined) updateData['profile.height'] = req.body.height;
    if (req.body.weight !== undefined) updateData['profile.weight'] = req.body.weight;
    if (req.body.fitnessLevel) updateData['profile.fitnessLevel'] = req.body.fitnessLevel;
    if (req.body.goals) updateData['profile.goals'] = req.body.goals;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        profile: user.profile,
        stats: user.stats,
        profileCompletion: user.profileCompletion,
        initials: user.getInitials()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Update subscription
// @route   PUT /api/users/subscription
// @access  Private
router.put('/subscription', protect, [
  body('plan')
    .isIn(['free', 'foundations', 'advanced', 'custom'])
    .withMessage('Invalid subscription plan'),
  body('status')
    .isIn(['active', 'inactive', 'cancelled'])
    .withMessage('Invalid subscription status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { plan, status } = req.body;

    const updateData = {
      'subscription.plan': plan,
      'subscription.status': status
    };

    // Set dates for active subscriptions
    if (status === 'active') {
      updateData['subscription.startDate'] = new Date();
      // Set end date based on plan (assuming monthly)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      updateData['subscription.endDate'] = endDate;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      stats: user.stats,
      profileCompletion: user.profileCompletion
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Update user stats
// @route   PUT /api/users/stats
// @access  Private
router.put('/stats', protect, [
  body('totalWorkouts')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total workouts must be a positive integer'),
  body('currentStreak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current streak must be a positive integer'),
  body('longestStreak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Longest streak must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {};
    
    if (req.body.totalWorkouts !== undefined) {
      updateData['stats.totalWorkouts'] = req.body.totalWorkouts;
    }
    if (req.body.currentStreak !== undefined) {
      updateData['stats.currentStreak'] = req.body.currentStreak;
    }
    if (req.body.longestStreak !== undefined) {
      updateData['stats.longestStreak'] = req.body.longestStreak;
    }
    if (req.body.lastWorkoutDate !== undefined) {
      updateData['stats.lastWorkoutDate'] = req.body.lastWorkoutDate;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats: user.stats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    // Soft delete - just deactivate the account
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      email: `deleted_${Date.now()}_${req.user.email}` // Make email unique
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @desc    Assign program to user (Admin only)
// @route   POST /api/users/:id/programs
// @access  Private/Admin
router.post('/:id/programs', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const { programId } = req.body;
    const userId = req.params.id;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: 'Program ID is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's assigned program
    user.assignedProgram = programId;
    await user.save();

    res.json({
      success: true,
      message: 'Program assigned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        assignedProgram: user.assignedProgram
      }
    });
  } catch (error) {
    console.error('Assign program error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's assigned program
// @route   GET /api/users/:id/program
// @access  Private
router.get('/:id/program', protect, async (req, res) => {
  try {
    const userId = req.params.id;

    // Users can only access their own program, admins can access any
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get assigned program
    const assignedProgram = await programAssignmentService.getUserAssignedProgram(userId);

    res.json({
      success: true,
      program: assignedProgram,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Get user program error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
