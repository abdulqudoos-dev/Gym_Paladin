const express = require('express');
const router = express.Router();
const UserStats = require('../models/UserStats');
const ProgramSession = require('../models/ProgramSession');
const { protect } = require('../middleware/auth');

// GET /api/user-stats - Get user statistics
router.get('/', protect, async (req, res) => {
  try {
    let userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      // Create new stats if none exist
      userStats = new UserStats({ userId: req.user._id });
      await userStats.save();
    }

    res.json({
      success: true,
      stats: userStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/achievements - Get user achievements
router.get('/achievements', protect, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      return res.json({
        success: true,
        achievements: []
      });
    }

    res.json({
      success: true,
      achievements: userStats.achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/records - Get personal records
router.get('/records', protect, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      return res.json({
        success: true,
        records: []
      });
    }

    res.json({
      success: true,
      records: userStats.personalRecords
    });
  } catch (error) {
    console.error('Get personal records error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/streak - Get streak information
router.get('/streak', protect, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      return res.json({
        success: true,
        streak: {
          current: 0,
          longest: 0,
          lastWorkout: null
        }
      });
    }

    res.json({
      success: true,
      streak: {
        current: userStats.currentStreak,
        longest: userStats.longestStreak,
        lastWorkout: userStats.lastWorkoutDate
      }
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/recent-sessions - Get recent workout sessions
router.get('/recent-sessions', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const sessions = await ProgramSession.find({ 
      userId: req.user._id,
      status: 'completed'
    })
    .populate('programId', 'title description')
    .sort({ completedAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get recent sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/weekly-progress - Get weekly progress
router.get('/weekly-progress', protect, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      return res.json({
        success: true,
        weeklyProgress: []
      });
    }

    // Get last 8 weeks of data
    const weeklyProgress = userStats.weeklyStats.slice(-8);

    res.json({
      success: true,
      weeklyProgress
    });
  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/monthly-progress - Get monthly progress
router.get('/monthly-progress', protect, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      return res.json({
        success: true,
        monthlyProgress: []
      });
    }

    // Get last 6 months of data
    const monthlyProgress = userStats.monthlyStats.slice(-6);

    res.json({
      success: true,
      monthlyProgress
    });
  } catch (error) {
    console.error('Get monthly progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/user-stats/update - Update stats after workout (called internally)
router.post('/update', protect, async (req, res) => {
  try {
    const { 
      totalWorkouts, 
      totalDuration, 
      totalCalories, 
      totalReps, 
      totalSets,
      xpEarned,
      achievements,
      personalRecords 
    } = req.body;

    let userStats = await UserStats.findOne({ userId: req.user._id });
    
    if (!userStats) {
      userStats = new UserStats({ userId: req.user._id });
    }

    // Update stats
    if (totalWorkouts) userStats.totalWorkouts += totalWorkouts;
    if (totalDuration) userStats.totalDuration += totalDuration;
    if (totalCalories) userStats.totalCalories += totalCalories;
    if (totalReps) userStats.totalReps += totalReps;
    if (totalSets) userStats.totalSets += totalSets;
    if (xpEarned) userStats.totalXP += xpEarned;

    // Add new achievements
    if (achievements && achievements.length > 0) {
      userStats.achievements.push(...achievements);
    }

    // Add new personal records
    if (personalRecords && personalRecords.length > 0) {
      userStats.personalRecords.push(...personalRecords);
    }

    // Update level based on XP
    const newLevel = Math.floor(userStats.totalXP / 100) + 1;
    if (newLevel > userStats.level) {
      userStats.level = newLevel;
      userStats.xpToNextLevel = 100;
    } else {
      userStats.xpToNextLevel = 100 - (userStats.totalXP % 100);
    }

    await userStats.save();

    res.json({
      success: true,
      message: 'Stats updated',
      stats: userStats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/user-stats/leaderboard - Get leaderboard (top users)
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { type = 'totalXP', limit = 10 } = req.query;
    
    const validTypes = ['totalXP', 'currentStreak', 'totalWorkouts', 'totalCalories'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid leaderboard type' 
      });
    }

    const leaderboard = await UserStats.find()
      .populate('userId', 'name avatar')
      .sort({ [type]: -1 })
      .limit(parseInt(limit))
      .select(`userId ${type} level`);

    res.json({
      success: true,
      leaderboard,
      type
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;

// Maxes API

// GET /api/user-stats/maxes?exerciseId=...&maxType=1RM
router.get('/maxes', protect, async (req, res) => {
  try {
    const { exerciseId, maxType = '1RM' } = req.query;
    if (!exerciseId) {
      return res.status(400).json({ success: false, message: 'exerciseId is required' });
    }

    let userStats = await UserStats.findOne({ userId: req.user._id });
    if (!userStats) {
      return res.json({ success: true, max: null });
    }

    // Find the latest matching record
    const matches = (userStats.personalRecords || []).filter(r => 
      r.exerciseId?.toString() === exerciseId && r.recordType === maxType
    );

    if (matches.length === 0) {
      return res.json({ success: true, max: null });
    }

    const latest = matches.sort((a, b) => new Date(b.achievedAt || 0) - new Date(a.achievedAt || 0))[0];
    res.json({ success: true, max: { value: latest.value, recordType: latest.recordType, exerciseId } });
  } catch (error) {
    console.error('Get max error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/user-stats/maxes { exerciseId, exerciseName, maxType, value }
router.post('/maxes', protect, async (req, res) => {
  try {
    const { exerciseId, exerciseName, maxType = '1RM', value } = req.body;
    if (!exerciseId || typeof value !== 'number') {
      return res.status(400).json({ success: false, message: 'exerciseId and numeric value are required' });
    }

    let userStats = await UserStats.findOne({ userId: req.user._id });
    if (!userStats) {
      userStats = new UserStats({ userId: req.user._id, personalRecords: [] });
    }

    const idx = (userStats.personalRecords || []).findIndex(r => 
      r.exerciseId?.toString() === exerciseId && r.recordType === maxType
    );

    const record = {
      exerciseId,
      exerciseName: exerciseName || '',
      recordType: maxType,
      value,
      achievedAt: new Date()
    };

    if (idx >= 0) {
      userStats.personalRecords[idx] = { ...userStats.personalRecords[idx].toObject?.() || userStats.personalRecords[idx], ...record };
    } else {
      userStats.personalRecords.push(record);
    }

    await userStats.save();
    res.json({ success: true, max: { exerciseId, recordType: maxType, value } });
  } catch (error) {
    console.error('Save max error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
