const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Import models
const Exercise = require('./models/Exercise');
const Workout = require('./models/Workout');
const Program = require('./models/Program');

const MONGODB_URI = process.env.MONGODB_URI;

const dummyExercises = [
  {
    name: 'Push-ups',
    category: 'Bodyweight',
    description: 'Classic upper body exercise targeting chest, shoulders, and triceps',
    mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    defaultSets: 3,
    defaultReps: 15,
    defaultRestTime: 60,
    tags: ['chest', 'shoulders', 'triceps', 'bodyweight']
  },
  {
    name: 'Squats',
    category: 'Bodyweight',
    description: 'Fundamental lower body exercise for legs and glutes',
    mediaUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=500',
    defaultSets: 3,
    defaultReps: 20,
    defaultRestTime: 60,
    tags: ['legs', 'glutes', 'bodyweight']
  },
  {
    name: 'Deadlifts',
    category: 'Strength',
    description: 'Compound movement targeting posterior chain',
    mediaUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestTime: 120,
    tags: ['back', 'glutes', 'hamstrings', 'strength']
  },
  {
    name: 'Bench Press',
    category: 'Strength',
    description: 'Upper body pressing movement for chest development',
    mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestTime: 90,
    tags: ['chest', 'shoulders', 'triceps', 'strength']
  },
  {
    name: 'Pull-ups',
    category: 'Bodyweight',
    description: 'Upper body pulling exercise for back and biceps',
    mediaUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=500',
    defaultSets: 3,
    defaultReps: 8,
    defaultRestTime: 90,
    tags: ['back', 'biceps', 'bodyweight']
  },
  {
    name: 'Plank',
    category: 'Core',
    description: 'Isometric core strengthening exercise',
    mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    defaultSets: 3,
    defaultReps: 30,
    defaultRestTime: 60,
    tags: ['core', 'stability', 'bodyweight']
  },
  {
    name: 'Lunges',
    category: 'Bodyweight',
    description: 'Single-leg exercise for legs and glutes',
    mediaUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=500',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestTime: 60,
    tags: ['legs', 'glutes', 'bodyweight']
  },
  {
    name: 'Mountain Climbers',
    category: 'Cardio',
    description: 'High-intensity cardio exercise',
    mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    defaultSets: 3,
    defaultReps: 20,
    defaultRestTime: 45,
    tags: ['cardio', 'core', 'bodyweight']
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Exercise.deleteMany({});
    await Workout.deleteMany({});
    await Program.deleteMany({});
    console.log('Cleared existing data');

    // Insert exercises
    const exercises = await Exercise.insertMany(dummyExercises);
    console.log(`Inserted ${exercises.length} exercises`);

    // Create workouts using the exercises
    const workouts = await Workout.insertMany([
      {
        title: 'Upper Body Strength',
        description: 'Focused upper body workout for building strength',
        difficulty: 'Intermediate',
        tags: ['strength', 'upper-body'],
        exercises: [
          {
            exerciseId: exercises[0]._id, // Push-ups
            sets: 3,
            reps: 15,
            restTime: 60,
            notes: 'Keep core tight'
          },
          {
            exerciseId: exercises[3]._id, // Bench Press
            sets: 4,
            reps: 10,
            restTime: 90,
            notes: 'Focus on controlled movement'
          },
          {
            exerciseId: exercises[4]._id, // Pull-ups
            sets: 3,
            reps: 8,
            restTime: 90,
            notes: 'Full range of motion'
          }
        ]
      },
      {
        title: 'Lower Body Power',
        description: 'Explosive lower body workout',
        difficulty: 'Advanced',
        tags: ['power', 'lower-body'],
        exercises: [
          {
            exerciseId: exercises[1]._id, // Squats
            sets: 4,
            reps: 20,
            restTime: 90,
            notes: 'Deep squats'
          },
          {
            exerciseId: exercises[2]._id, // Deadlifts
            sets: 4,
            reps: 8,
            restTime: 120,
            notes: 'Keep back straight'
          },
          {
            exerciseId: exercises[6]._id, // Lunges
            sets: 3,
            reps: 12,
            restTime: 60,
            notes: 'Alternate legs'
          }
        ]
      },
      {
        title: 'Core & Cardio',
        description: 'High-intensity core and cardio workout',
        difficulty: 'Beginner',
        tags: ['cardio', 'core'],
        exercises: [
          {
            exerciseId: exercises[5]._id, // Plank
            sets: 3,
            reps: 30,
            restTime: 60,
            notes: 'Hold position'
          },
          {
            exerciseId: exercises[7]._id, // Mountain Climbers
            sets: 3,
            reps: 20,
            restTime: 45,
            notes: 'Fast pace'
          }
        ]
      }
    ]);
    console.log(`Inserted ${workouts.length} workouts`);

    // Create programs using the workouts
    const programs = await Program.insertMany([
      {
        title: '8-Week Strength Program',
        description: 'Comprehensive strength building program',
        duration: 8,
        tags: ['strength', '8-week'],
        days: [
          {
            day: 1,
            workouts: [workouts[0]._id] // Upper Body Strength
          },
          {
            day: 2,
            workouts: [workouts[1]._id] // Lower Body Power
          },
          {
            day: 3,
            workouts: [workouts[2]._id] // Core & Cardio
          },
          {
            day: 4,
            workouts: [workouts[0]._id] // Upper Body Strength
          },
          {
            day: 5,
            workouts: [workouts[1]._id] // Lower Body Power
          },
          {
            day: 6,
            workouts: [workouts[2]._id] // Core & Cardio
          },
          {
            day: 7,
            workouts: [] // Rest day
          },
          {
            day: 8,
            workouts: [workouts[0]._id, workouts[1]._id] // Combined workout
          }
        ]
      },
      {
        title: 'Beginner Fitness Program',
        description: 'Perfect for fitness beginners',
        duration: 4,
        tags: ['beginner', '4-week'],
        days: [
          {
            day: 1,
            workouts: [workouts[2]._id] // Core & Cardio
          },
          {
            day: 2,
            workouts: [workouts[0]._id] // Upper Body Strength
          },
          {
            day: 3,
            workouts: [workouts[1]._id] // Lower Body Power
          },
          {
            day: 4,
            workouts: [workouts[2]._id] // Core & Cardio
          }
        ]
      }
    ]);
    console.log(`Inserted ${programs.length} programs`);

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${exercises.length} exercises`);
    console.log(`   - ${workouts.length} workouts`);
    console.log(`   - ${programs.length} programs`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData();
