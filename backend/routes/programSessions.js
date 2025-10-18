const express = require('express');
const router = express.Router();
const ProgramSession = require('../models/ProgramSession');
const Program = require('../models/Program');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const { protect } = require('../middleware/auth');

// Generate unique session ID
const generateSessionId = () => {
  return `program_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// GET /api/program-sessions - Get all user's program sessions
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await ProgramSession.find({ userId: req.user._id })
      .populate('programId', 'title description')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/program-sessions - Start a new program session
router.post('/', protect, async (req, res) => {
  try {
    const { programId, week, day, workoutIndex } = req.body;
    
    if (!programId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Program ID is required' 
      });
    }

    // Get user's assigned program
    const user = await User.findById(req.user._id).populate('assignedProgram');
    if (!user || !user.assignedProgram) {
      return res.status(404).json({ 
        success: false, 
        message: 'No program assigned to user' 
      });
    }

    // Get program details
    const program = await Program.findById(programId).populate('days.workouts.workoutId');
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Program not found' 
      });
    }

    // Find the specific day's workout
    const targetDay = program.days.find(d => d.week === (week || 1) && d.day === (day || 1));
    if (!targetDay || !targetDay.workouts.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'No workout found for this day' 
      });
    }

    const workoutIndexToUse = workoutIndex || 0; // Default to first workout if not specified
    const workout = targetDay.workouts[workoutIndexToUse]?.workoutId; // Get specified workout of the day
    
    if (!workout) {
      return res.status(404).json({ 
        success: false, 
        message: `Workout at index ${workoutIndexToUse} not found for this day` 
      });
    }

    // CHECK FOR EXISTING ACTIVE SESSION FIRST - PREVENT DUPLICATES
    const existingSession = await ProgramSession.findOne({
      userId: req.user._id,
      programId: programId,
      week: week || 1,
      day: day || 1,
      currentWorkoutIndex: workoutIndexToUse,
      status: { $in: ['preparing', 'active', 'paused'] }
    });

    if (existingSession) {
      console.log(`Found existing session ${existingSession._id} for workout ${week}-${day}-${workoutIndexToUse}`);
      return res.json({
        success: true,
        message: 'Existing session found',
        session: existingSession
      });
    }

    // ADDITIONAL CHECK: Look for any session (including completed) for the same workout
    // This prevents creating multiple sessions for the same workout
    const anyExistingSession = await ProgramSession.findOne({
      userId: req.user._id,
      programId: programId,
      week: week || 1,
      day: day || 1,
      currentWorkoutIndex: workoutIndexToUse
    });

    if (anyExistingSession && anyExistingSession.status === 'completed') {
      console.log(`Found completed session for same workout. Allowing restart.`);
      // Allow restart of completed workout - don't return existing session
    } else if (anyExistingSession) {
      console.log(`Found non-active session for same workout: ${anyExistingSession.status}`);
      return res.json({
        success: true,
        message: 'Session exists for this workout',
        session: anyExistingSession
      });
    }
    
    // Populate exercises in the workout
    const populatedWorkout = await Workout.findById(workout._id).populate('exercises.exerciseId');
    if (!populatedWorkout) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workout not found' 
      });
    }

    // Create session directly - generate sets with optional per-set scheme and hidden percentages
    const sessionId = generateSessionId();
    const session = await ProgramSession.create({
      userId: req.user._id,
      programId: program._id,
      week: week || 1,
      day: day || 1,
      sessionId,
      currentWorkoutIndex: workoutIndexToUse,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalExercises: populatedWorkout.exercises.length,
      exercises: populatedWorkout.exercises.map((exercise, index) => {
        const useScheme = Array.isArray(exercise.setScheme) && exercise.setScheme.length > 0;
        const setsArray = useScheme
          ? exercise.setScheme.map((s) => ({
              reps: typeof s.reps === 'number' ? s.reps : (parseInt(exercise.reps?.split('-')[0]) || 10),
              weight: 0,
              restTime: typeof s.restTime === 'number' ? s.restTime : exercise.restTime,
              // Normalize percent: accept 0-1 or 0-100 from input; store as decimal 0-1
              percent: (typeof s.percent === 'number') ? (s.percent > 1 ? s.percent / 100 : s.percent) : undefined,
              notes: '',
              isCompleted: false
            }))
          : Array(exercise.sets).fill(null).map(() => ({
              reps: parseInt(exercise.reps?.split('-')[0]) || 10,
              weight: 0,
              restTime: exercise.restTime,
              notes: '',
              isCompleted: false
            }));

        return {
          exerciseId: exercise.exerciseId._id,
          exerciseName: exercise.exerciseId.name,
          order: index + 1,
          sets: setsArray,
          maxType: exercise.maxType || '1RM',
          isCompleted: false
        };
      })
    });
    
    res.status(201).json({
      success: true,
      message: 'Program session started',
      session: session
    });
  } catch (error) {
    console.error('Start program session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/program-sessions/:id - Get current session details
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
    console.error('Get session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT /api/program-sessions/:id - Update session progress
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
    console.error('Update session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/program-sessions/:id/cancel - Cancel workout
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
    console.error('Cancel workout error:', error);
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
