const express = require('express');
const router = express.Router();
const ProgramSession = require('../models/ProgramSession');
const { protect } = require('../middleware/auth');

// GET /api/workout-sessions/:id - Get workout session details (alias for program-sessions)
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.id)
      .populate({
        path: 'programId',
        populate: {
          path: 'days.workouts.workoutId',
          select: 'title description exercises difficulty duration'
        }
      });
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Populate exercise details for each exercise in the session
    const populatedExercises = await Promise.all(
      session.exercises.map(async (exercise) => {
        const Exercise = require('../models/Exercise');
        const exerciseDetails = await Exercise.findById(exercise.exerciseId);
        return {
          ...exercise.toObject(),
          exerciseDetails: exerciseDetails
        };
      })
    );

    let sessionObj = session.toObject();
    sessionObj = { ...sessionObj, exercises: populatedExercises };

    // Enrich sets.percent from source workout if missing (backward compatibility)
    try {
      const program = session.programId; // populated above
      if (program && Array.isArray(program.days)) {
        const dayEntry = program.days.find(d => d.week === session.week && d.day === session.day);
        const workout = dayEntry?.workouts?.[session.currentWorkoutIndex || 0]?.workoutId;
        if (workout && Array.isArray(workout.exercises)) {
          sessionObj.exercises = sessionObj.exercises.map((ex, idx) => {
            const workoutEx = workout.exercises[idx];
            if (workoutEx && Array.isArray(workoutEx.setScheme) && Array.isArray(ex.sets)) {
              const updatedSets = ex.sets.map((s, sIdx) => {
                if (s && (s.percent === undefined || s.percent === null)) {
                  const scheme = workoutEx.setScheme[sIdx];
                  if (scheme && typeof scheme.percent === 'number') {
                    const normalized = scheme.percent > 1 ? scheme.percent / 100 : scheme.percent;
                    return { ...s, percent: normalized };
                  }
                }
                return s;
              });
              return { ...ex, sets: updatedSets, maxType: ex.maxType || workoutEx.maxType || '1RM' };
            }
            return ex;
          });
        }
      }
    } catch (e) {
      console.warn('Percent enrichment failed:', e?.message || e);
    }

    res.json({
      success: true,
      session: sessionObj
    });
  } catch (error) {
    console.error('Get workout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT /api/workout-sessions/:id - Update workout session progress (alias for program-sessions)
router.put('/:id', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const { 
      status, 
      currentExerciseIndex, 
      currentSetIndex, 
      caloriesBurned,
      totalDuration,
      exercises,
      notes,
      exercisesCompleted
    } = req.body;

    // Update session fields
    if (status) session.status = status;
    if (currentExerciseIndex !== undefined) session.currentExerciseIndex = currentExerciseIndex;
    if (currentSetIndex !== undefined) session.currentSetIndex = currentSetIndex;
    if (caloriesBurned !== undefined) session.caloriesBurned = caloriesBurned;
    if (totalDuration !== undefined) session.totalDuration = totalDuration;
    if (exercises) session.exercises = exercises;
    if (notes) session.notes = notes;
    if (exercisesCompleted !== undefined) session.exercisesCompleted = exercisesCompleted;

    // Handle status-specific updates
    if (status === 'paused') {
      session.pausedAt = new Date();
    } else if (status === 'active' && session.status === 'paused') {
      session.resumedAt = new Date();
      if (session.pausedAt) {
        const pausedDuration = Date.now() - session.pausedAt.getTime();
        session.pausedDuration = (session.pausedDuration || 0) + pausedDuration;
      }
    } else if (status === 'completed') {
      session.completedAt = new Date();
    }

    // Use findByIdAndUpdate to avoid version conflicts
    const updatedSession = await ProgramSession.findByIdAndUpdate(
      session._id,
      {
        status: session.status,
        currentExerciseIndex: session.currentExerciseIndex,
        currentSetIndex: session.currentSetIndex,
        caloriesBurned: session.caloriesBurned,
        totalDuration: session.totalDuration,
        exercises: session.exercises,
        notes: session.notes,
        exercisesCompleted: session.exercisesCompleted,
        pausedAt: session.pausedAt,
        resumedAt: session.resumedAt,
        pausedDuration: session.pausedDuration,
        completedAt: session.completedAt
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Session updated',
      session: updatedSession
    });
  } catch (error) {
    console.error('Update workout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/workout-sessions/:id/complete - Complete workout session (alias for program-sessions)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Complete the session
    session.status = 'completed';
    session.completedAt = new Date();
    
    // Calculate total duration (excluding paused time)
    const totalDuration = Math.floor((new Date() - session.startedAt) / 1000) - (session.pausedDuration || 0);
    session.totalDuration = totalDuration;

    // Calculate total reps, sets, and exercises completed
    let totalReps = 0;
    let totalSets = 0;
    let exercisesCompleted = 0;
    
    session.exercises.forEach(exercise => {
      let exerciseCompleted = true;
      let exerciseSetsCompleted = 0;
      
      exercise.sets.forEach(set => {
        if (set.isCompleted) {
          totalReps += set.reps || 0;
          totalSets += 1;
          exerciseSetsCompleted += 1;
        } else {
          exerciseCompleted = false;
        }
      });
      
      // Mark exercise as completed if all sets are done
      if (exerciseCompleted && exerciseSetsCompleted === exercise.sets.length && exerciseSetsCompleted > 0) {
        exercisesCompleted += 1;
        exercise.isCompleted = true;
        exercise.completedAt = new Date();
      } else {
        exercise.isCompleted = false;
      }
    });
    
    session.totalReps = totalReps;
    session.totalSets = totalSets;
    session.exercisesCompleted = exercisesCompleted;
    
    console.log(`Workout completed: ${exercisesCompleted}/${session.totalExercises} exercises (${Math.round((exercisesCompleted / session.totalExercises) * 100)}%)`);

    // Calculate calories burned (rough estimate: 5-8 calories per minute for moderate exercise)
    const caloriesPerMinute = 6; // Average calories per minute
    const workoutMinutes = Math.floor(totalDuration / 60);
    session.caloriesBurned = Math.round(workoutMinutes * caloriesPerMinute);

    // Use findByIdAndUpdate to avoid version conflicts
    const updatedSession = await ProgramSession.findByIdAndUpdate(
      session._id,
      {
        status: session.status,
        completedAt: session.completedAt,
        totalDuration: session.totalDuration,
        totalReps: session.totalReps,
        totalSets: session.totalSets,
        exercisesCompleted: session.exercisesCompleted,
        caloriesBurned: session.caloriesBurned,
        exercises: session.exercises
      },
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found during update' 
      });
    }

    // Update user stats
    await updateUserStats(req.user._id, updatedSession);

    res.json({
      success: true,
      message: 'Workout completed',
      session: {
        id: session._id,
        status: session.status,
        exercisesCompleted: session.exercisesCompleted,
        totalExercises: session.totalExercises,
        percentage: 100,
        caloriesBurned: session.caloriesBurned,
        totalDuration: session.totalDuration
      }
    });
  } catch (error) {
    console.error('Complete workout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/workout-sessions/:id/cancel - Cancel workout session (alias for program-sessions)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Use findByIdAndUpdate to avoid version conflicts
    const updatedSession = await ProgramSession.findByIdAndUpdate(
      session._id,
      { status: 'cancelled' },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Workout cancelled',
      session: updatedSession
    });
  } catch (error) {
    console.error('Cancel workout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Helper function to update user stats
const updateUserStats = async (userId, session) => {
  try {
    const UserStats = require('../models/UserStats');
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      userStats = new UserStats({ userId });
    }

    // Update overall stats
    userStats.totalWorkouts += 1;
    userStats.totalDuration += Math.floor(session.totalDuration / 60); // Convert to minutes
    userStats.totalCalories += session.caloriesBurned;
    userStats.totalReps += session.totalReps;
    userStats.totalSets += session.totalSets;
    userStats.lastWorkoutDate = new Date();

    // Update streak
    const today = new Date();
    const lastWorkout = userStats.lastWorkoutDate;
    
    if (lastWorkout) {
      const daysDiff = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        userStats.currentStreak += 1;
      } else if (daysDiff > 1) {
        userStats.currentStreak = 1;
      }
    } else {
      userStats.currentStreak = 1;
    }

    if (userStats.currentStreak > userStats.longestStreak) {
      userStats.longestStreak = userStats.currentStreak;
    }

    // Update XP
    const xpEarned = 50 + (session.exercisesCompleted * 10); // Base XP + exercise bonus
    userStats.totalXP += xpEarned;

    // Check for level up
    const newLevel = Math.floor(userStats.totalXP / 100) + 1;
    if (newLevel > userStats.level) {
      userStats.level = newLevel;
      userStats.xpToNextLevel = 100;
    } else {
      userStats.xpToNextLevel = 100 - (userStats.totalXP % 100);
    }

    await userStats.save();
  } catch (error) {
    console.error('Update user stats error:', error);
  }
};

module.exports = router;
