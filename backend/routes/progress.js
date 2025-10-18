const express = require('express');
const router = express.Router();
const ProgramSession = require('../models/ProgramSession');
const UserStats = require('../models/UserStats');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for progress endpoints
const progressLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many progress requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all progress routes
router.use(progressLimiter);

// GET /api/progress/:programId - Get all progress for a program
router.get('/:programId', protect, async (req, res) => {
  try {
    const { programId } = req.params;
    
    // Get program details to know all workouts
    const Program = require('../models/Program');
    const program = await Program.findById(programId).populate('days.workouts.workoutId');
    
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Program not found' 
      });
    }
    
    // Get all existing sessions
    const sessions = await ProgramSession.find({ 
      userId: req.user._id, 
      programId: programId 
    }).sort({ week: 1, day: 1, currentWorkoutIndex: 1 });
    
    console.log(`Found ${sessions.length} sessions for program ${programId}`);
    
    // Create unified progress map
    const progressMap = {};
    
    // Process each day in the program
    program.days.forEach(day => {
      day.workouts.forEach((workout, workoutIndex) => {
        const key = `${day.week}-${day.day}-${workoutIndex}`;
        
        // Find existing session for this workout
        const existingSession = sessions.find(session => 
          session.week === day.week && 
          session.day === day.day && 
          session.currentWorkoutIndex === workoutIndex
        );
        
        if (existingSession) {
          // Session exists - use actual progress
          let percentage = 0;
          let status = 'not-started';
          let actualExercisesCompleted = 0; // Initialize outside conditional blocks
          
          if (existingSession.status === 'completed') {
            percentage = 100;
            status = 'completed';
            actualExercisesCompleted = existingSession.exercisesCompleted || 0;
          } else if (existingSession.status === 'active' || existingSession.status === 'paused') {
            // Calculate progress based on exercises completed
            if (existingSession.totalExercises > 0) {
              // Recalculate exercisesCompleted from actual exercise data for accuracy
              if (existingSession.exercises && existingSession.exercises.length > 0) {
                existingSession.exercises.forEach(exercise => {
                  if (exercise.isCompleted) {
                    actualExercisesCompleted += 1;
                  }
                });
              }
              
              // Use the higher of stored value or calculated value
              const exercisesCompleted = Math.max(existingSession.exercisesCompleted || 0, actualExercisesCompleted);
              percentage = Math.round((exercisesCompleted / existingSession.totalExercises) * 100);
              
              // Ensure percentage doesn't exceed 100%
              percentage = Math.min(percentage, 100);
              
              // Update the stored value if it was incorrect
              if (exercisesCompleted !== existingSession.exercisesCompleted) {
                console.log(`Correcting exercisesCompleted: ${existingSession.exercisesCompleted} → ${exercisesCompleted}`);
                // Update in background without blocking the response
                ProgramSession.findByIdAndUpdate(existingSession._id, {
                  exercisesCompleted: exercisesCompleted
                }).catch(err => console.error('Error updating exercisesCompleted:', err));
              }
            } else {
              percentage = 0;
            }
            status = 'in-progress';
          } else if (existingSession.status === 'cancelled') {
            // For cancelled sessions, show actual progress but mark as cancelled
            if (existingSession.totalExercises > 0) {
              if (existingSession.exercises && existingSession.exercises.length > 0) {
                existingSession.exercises.forEach(exercise => {
                  if (exercise.isCompleted) {
                    actualExercisesCompleted += 1;
                  }
                });
              }
              percentage = Math.round((actualExercisesCompleted / existingSession.totalExercises) * 100);
            } else {
              percentage = 0;
            }
            status = 'cancelled';
          }
          
          console.log(`Session ${key}: ${Math.max(existingSession.exercisesCompleted || 0, actualExercisesCompleted || 0)}/${existingSession.totalExercises} exercises (${percentage}%) - ${status}`);
          
          progressMap[key] = {
            status,
            percentage,
            exercisesCompleted: Math.max(existingSession.exercisesCompleted || 0, actualExercisesCompleted || 0),
            totalExercises: existingSession.totalExercises,
            lastCompleted: existingSession.completedAt,
            caloriesBurned: existingSession.caloriesBurned || 0,
            totalDuration: existingSession.totalDuration || 0,
            sessionId: existingSession._id,
            currentExerciseIndex: existingSession.currentExerciseIndex,
            currentSetIndex: existingSession.currentSetIndex
          };
        } else {
          // No session exists - create virtual entry for not-started workout
          const totalExercises = workout.workoutId?.exercises?.length || 0;
          
          progressMap[key] = {
            status: 'not-started',
            percentage: 0,
            exercisesCompleted: 0,
            totalExercises: totalExercises,
            lastCompleted: null,
            caloriesBurned: 0,
            totalDuration: 0,
            sessionId: null,
            currentExerciseIndex: 0,
            currentSetIndex: 0
          };
          
          console.log(`Virtual session ${key}: 0/${totalExercises} exercises (0%) - not-started`);
        }
      });
    });
    
    res.json({
      success: true,
      progress: progressMap
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT /api/progress/:sessionId - Update session progress
router.put('/:sessionId', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.sessionId);
    
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

    if (!updatedSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found during update' 
      });
    }

    res.json({
      success: true,
      message: 'Progress updated',
      session: {
        id: updatedSession._id,
        status: updatedSession.status,
        exercisesCompleted: updatedSession.exercisesCompleted,
        totalExercises: updatedSession.totalExercises,
        percentage: updatedSession.totalExercises > 0 
          ? Math.round((updatedSession.exercisesCompleted / updatedSession.totalExercises) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/progress/:sessionId/complete - Complete workout
router.post('/:sessionId/complete', protect, async (req, res) => {
  try {
    const session = await ProgramSession.findById(req.params.sessionId);
    
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
    console.error('Complete workout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/progress/calendar/:year/:month - Get calendar data
router.get('/calendar/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Get all completed sessions for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const sessions = await ProgramSession.find({
      userId: req.user._id,
      status: 'completed',
      completedAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('programId', 'title description');
    
    // Group sessions by date
    const calendarData = {};
    sessions.forEach(session => {
      const dateStr = session.completedAt.toISOString().split('T')[0];
      
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = {
          date: dateStr,
          workoutCount: 0,
          totalCalories: 0,
          totalDuration: 0,
          sessions: [],
          exerciseProgress: []
        };
      }
      
      calendarData[dateStr].workoutCount += 1;
      calendarData[dateStr].totalCalories += session.caloriesBurned || 0;
      calendarData[dateStr].totalDuration += session.totalDuration || 0;
      
      calendarData[dateStr].sessions.push({
        id: session._id,
        workoutId: session.programId._id,
        programId: session.programId._id,
        week: session.week,
        day: session.day,
        completedAt: session.completedAt.toISOString(),
        status: session.status,
        caloriesBurned: session.caloriesBurned,
        totalDuration: session.totalDuration
      });
      
      calendarData[dateStr].exerciseProgress.push({
        workoutId: session.programId._id,
        workoutTitle: session.programId.title,
        totalExercises: session.totalExercises,
        completedExercises: session.exercisesCompleted,
        progressPercentage: session.totalExercises > 0 
          ? Math.round((session.exercisesCompleted / session.totalExercises) * 100)
          : 0,
        status: 'completed',
        week: session.week,
        day: session.day,
        caloriesBurned: session.caloriesBurned,
        totalDuration: session.totalDuration
      });
    });
    
    // Convert calendarData object to array
    const calendarArray = Object.values(calendarData);
    
    res.json({
      success: true,
      calendarData: calendarArray
    });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Helper function to update user stats
const updateUserStats = async (userId, session) => {
  try {
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
