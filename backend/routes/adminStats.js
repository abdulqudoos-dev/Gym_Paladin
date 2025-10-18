const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProgramSession = require('../models/ProgramSession');
const Workout = require('../models/Workout');
const Program = require('../models/Program');
const Exercise = require('../models/Exercise');
const { protect } = require('../middleware/auth');

// GET /api/admin-stats - Get admin dashboard statistics
router.get('/', protect, async (req, res) => {
  try {
    // Get total counts
    const [
      totalUsers,
      totalWorkouts,
      totalPrograms,
      totalExercises,
      completedSessions,
      activeSessions
    ] = await Promise.all([
      User.countDocuments(),
      Workout.countDocuments(),
      Program.countDocuments(),
      Exercise.countDocuments(),
      ProgramSession.countDocuments({ status: 'completed' }),
      ProgramSession.countDocuments({ status: { $in: ['active', 'paused'] } })
    ]);

    // Get recent sessions for the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentSessions = await ProgramSession.find({
      startedAt: { $gte: tenMinutesAgo }
    }).sort({ startedAt: -1 });

    // Group sessions by minute for the chart
    const now = Date.now();
    const buckets = new Array(10).fill(0);
    recentSessions.forEach(session => {
      const sessionTime = new Date(session.startedAt).getTime();
      const diffMin = Math.floor((now - sessionTime) / 60000);
      if (diffMin >= 0 && diffMin < 10) {
        buckets[9 - diffMin] += 1;
      }
    });

    // Get today's completed workouts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCompleted = await ProgramSession.countDocuments({
      status: 'completed',
      completedAt: { $gte: today, $lt: tomorrow }
    });

    // Get this week's completed workouts
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeekCompleted = await ProgramSession.countDocuments({
      status: 'completed',
      completedAt: { $gte: weekStart }
    });

    // Get this month's completed workouts
    const monthStart = new Date(today);
    monthStart.setDate(1);
    const thisMonthCompleted = await ProgramSession.countDocuments({
      status: 'completed',
      completedAt: { $gte: monthStart }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkouts,
        totalPrograms,
        totalExercises,
        completedSessions,
        activeSessions,
        todayCompleted,
        thisWeekCompleted,
        thisMonthCompleted,
        recentSessions: buckets
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
