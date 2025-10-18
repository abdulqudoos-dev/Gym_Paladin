const mongoose = require('mongoose');
const Program = require('./models/Program');
const Workout = require('./models/Workout');

// First, let's create detailed workouts for our 8-day program
const workouts = [
  {
    title: "Upper Body Strength Day 1",
    description: "Focus on chest, shoulders, and triceps with compound movements",
    duration: 60,
    difficulty: "Intermediate",
    category: "Strength",
    exercises: [
      {
        name: "Bench Press",
        description: "Lie flat on bench, lower bar to chest, press up explosively",
        sets: 4,
        reps: "8-10",
        weight: "Body weight + 20-40lbs",
        restTime: 120, // seconds
        exerciseTime: 45, // seconds per set
        instructions: "Keep core tight, maintain arch in back, control the weight",
        muscleGroups: ["chest", "shoulders", "triceps"],
        equipment: ["barbell", "bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Overhead Press",
        description: "Stand with feet shoulder-width apart, press bar overhead",
        sets: 3,
        reps: "8-12",
        weight: "Body weight + 10-20lbs",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Keep core engaged, press straight up, don't arch back",
        muscleGroups: ["shoulders", "triceps", "core"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Incline Dumbbell Press",
        description: "Press dumbbells at 45-degree incline",
        sets: 3,
        reps: "10-12",
        weight: "20-35lbs each",
        restTime: 90,
        exerciseTime: 35,
        instructions: "Control the weight, squeeze chest at top",
        muscleGroups: ["chest", "shoulders"],
        equipment: ["dumbbells", "incline bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Tricep Dips",
        description: "Lower body using triceps, push back up",
        sets: 3,
        reps: "8-15",
        weight: "Body weight",
        restTime: 60,
        exerciseTime: 30,
        instructions: "Keep elbows close to body, lean forward slightly",
        muscleGroups: ["triceps", "chest"],
        equipment: ["dip bars"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Lateral Raises",
        description: "Raise dumbbells to sides until parallel to floor",
        sets: 3,
        reps: "12-15",
        weight: "10-20lbs each",
        restTime: 60,
        exerciseTime: 25,
        instructions: "Control the movement, slight pause at top",
        muscleGroups: ["shoulders"],
        equipment: ["dumbbells"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Lower Body Power Day 2",
    description: "Explosive leg movements focusing on power and strength",
    duration: 65,
    difficulty: "Intermediate",
    category: "Strength",
    exercises: [
      {
        name: "Back Squat",
        description: "Squat down keeping chest up, drive through heels",
        sets: 4,
        reps: "6-8",
        weight: "Body weight + 40-80lbs",
        restTime: 150,
        exerciseTime: 50,
        instructions: "Keep knees tracking over toes, maintain neutral spine",
        muscleGroups: ["quadriceps", "glutes", "hamstrings", "core"],
        equipment: ["barbell", "squat rack"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Romanian Deadlift",
        description: "Hinge at hips, lower bar along legs, drive hips forward",
        sets: 4,
        reps: "8-10",
        weight: "Body weight + 30-60lbs",
        restTime: 120,
        exerciseTime: 45,
        instructions: "Keep bar close to body, feel stretch in hamstrings",
        muscleGroups: ["hamstrings", "glutes", "lower back"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Bulgarian Split Squats",
        description: "Single leg squat with rear foot elevated",
        sets: 3,
        reps: "10-12 each leg",
        weight: "Body weight + 20-40lbs",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Keep front knee over ankle, control the descent",
        muscleGroups: ["quadriceps", "glutes"],
        equipment: ["bench", "dumbbells"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Walking Lunges",
        description: "Step forward into lunge, alternate legs",
        sets: 3,
        reps: "12-15 each leg",
        weight: "Body weight + 20-40lbs",
        restTime: 60,
        exerciseTime: 35,
        instructions: "Keep torso upright, step far enough to create 90-degree angles",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        equipment: ["dumbbells"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Calf Raises",
        description: "Rise up on toes, lower slowly",
        sets: 4,
        reps: "15-20",
        weight: "Body weight + 40-80lbs",
        restTime: 45,
        exerciseTime: 20,
        instructions: "Full range of motion, pause at top",
        muscleGroups: ["calves"],
        equipment: ["calf raise machine", "dumbbells"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Push Day 3",
    description: "Chest, shoulders, and triceps focused workout",
    duration: 55,
    difficulty: "Intermediate",
    category: "Strength",
    exercises: [
      {
        name: "Incline Barbell Press",
        description: "Press barbell at 30-45 degree incline",
        sets: 4,
        reps: "8-10",
        weight: "Body weight + 20-40lbs",
        restTime: 120,
        exerciseTime: 45,
        instructions: "Control the weight, full range of motion",
        muscleGroups: ["chest", "shoulders", "triceps"],
        equipment: ["barbell", "incline bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Dumbbell Flyes",
        description: "Lower dumbbells in wide arc, bring together",
        sets: 3,
        reps: "10-12",
        weight: "15-30lbs each",
        restTime: 90,
        exerciseTime: 35,
        instructions: "Slight bend in elbows, feel stretch in chest",
        muscleGroups: ["chest"],
        equipment: ["dumbbells", "bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Arnold Press",
        description: "Rotate dumbbells from front to overhead",
        sets: 3,
        reps: "10-12",
        weight: "15-25lbs each",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Control the rotation, press overhead",
        muscleGroups: ["shoulders", "triceps"],
        equipment: ["dumbbells"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Close-Grip Bench Press",
        description: "Bench press with hands closer together",
        sets: 3,
        reps: "8-12",
        weight: "Body weight + 10-30lbs",
        restTime: 90,
        exerciseTime: 35,
        instructions: "Keep elbows close to body, focus on triceps",
        muscleGroups: ["triceps", "chest"],
        equipment: ["barbell", "bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Face Pulls",
        description: "Pull cable to face, external rotation",
        sets: 3,
        reps: "12-15",
        weight: "20-40lbs",
        restTime: 60,
        exerciseTime: 30,
        instructions: "Pull to face level, squeeze shoulder blades",
        muscleGroups: ["rear delts", "rhomboids"],
        equipment: ["cable machine"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Pull Day 4",
    description: "Back and biceps focused workout",
    duration: 60,
    difficulty: "Intermediate",
    category: "Strength",
    exercises: [
      {
        name: "Deadlift",
        description: "Lift bar from floor to standing position",
        sets: 4,
        reps: "5-6",
        weight: "Body weight + 60-120lbs",
        restTime: 180,
        exerciseTime: 60,
        instructions: "Keep bar close to body, drive through heels",
        muscleGroups: ["hamstrings", "glutes", "back", "core"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Pull-ups",
        description: "Pull body up until chin over bar",
        sets: 4,
        reps: "6-12",
        weight: "Body weight",
        restTime: 120,
        exerciseTime: 40,
        instructions: "Full range of motion, control the descent",
        muscleGroups: ["lats", "biceps", "rhomboids"],
        equipment: ["pull-up bar"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Bent-Over Barbell Rows",
        description: "Row bar to lower chest, squeeze shoulder blades",
        sets: 4,
        reps: "8-10",
        weight: "Body weight + 20-50lbs",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Keep chest up, row to lower chest",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Hammer Curls",
        description: "Curl dumbbells with neutral grip",
        sets: 3,
        reps: "10-12",
        weight: "15-30lbs each",
        restTime: 60,
        exerciseTime: 30,
        instructions: "Control the weight, squeeze biceps at top",
        muscleGroups: ["biceps", "forearms"],
        equipment: ["dumbbells"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Cable Rows",
        description: "Row cable to chest, squeeze shoulder blades",
        sets: 3,
        reps: "12-15",
        weight: "40-80lbs",
        restTime: 60,
        exerciseTime: 35,
        instructions: "Keep chest up, row to chest",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        equipment: ["cable machine"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Legs & Glutes Day 5",
    description: "Comprehensive lower body workout",
    duration: 70,
    difficulty: "Intermediate",
    category: "Strength",
    exercises: [
      {
        name: "Front Squat",
        description: "Squat with bar in front rack position",
        sets: 4,
        reps: "8-10",
        weight: "Body weight + 20-60lbs",
        restTime: 120,
        exerciseTime: 50,
        instructions: "Keep elbows up, maintain upright torso",
        muscleGroups: ["quadriceps", "glutes", "core"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Hip Thrusts",
        description: "Thrust hips up, squeeze glutes at top",
        sets: 4,
        reps: "12-15",
        weight: "Body weight + 40-80lbs",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Drive through heels, squeeze glutes hard",
        muscleGroups: ["glutes", "hamstrings"],
        equipment: ["barbell", "bench"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Leg Press",
        description: "Press weight away with legs",
        sets: 3,
        reps: "12-15",
        weight: "Body weight + 100-200lbs",
        restTime: 90,
        exerciseTime: 35,
        instructions: "Full range of motion, control the weight",
        muscleGroups: ["quadriceps", "glutes"],
        equipment: ["leg press machine"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Stiff Leg Deadlifts",
        description: "Deadlift with minimal knee bend",
        sets: 3,
        reps: "10-12",
        weight: "Body weight + 20-50lbs",
        restTime: 90,
        exerciseTime: 40,
        instructions: "Feel stretch in hamstrings, keep legs straighter",
        muscleGroups: ["hamstrings", "glutes"],
        equipment: ["barbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Step-ups",
        description: "Step up onto box, alternate legs",
        sets: 3,
        reps: "10-12 each leg",
        weight: "Body weight + 20-40lbs",
        restTime: 60,
        exerciseTime: 35,
        instructions: "Drive through heel, control the descent",
        muscleGroups: ["quadriceps", "glutes"],
        equipment: ["box", "dumbbells"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Full Body HIIT Day 6",
    description: "High-intensity interval training for fat burning",
    duration: 45,
    difficulty: "Advanced",
    category: "HIIT",
    exercises: [
      {
        name: "Burpees",
        description: "Squat, plank, push-up, jump up",
        sets: 4,
        reps: "10-15",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 45,
        instructions: "Maintain good form, keep intensity high",
        muscleGroups: ["full body"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Mountain Climbers",
        description: "Alternate bringing knees to chest in plank",
        sets: 4,
        reps: "20-30",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 30,
        instructions: "Keep core tight, maintain plank position",
        muscleGroups: ["core", "shoulders", "legs"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Jump Squats",
        description: "Squat down, explode up into jump",
        sets: 4,
        reps: "15-20",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 30,
        instructions: "Land softly, maintain good squat form",
        muscleGroups: ["quadriceps", "glutes"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Push-up to T",
        description: "Push-up, rotate to side plank",
        sets: 3,
        reps: "8-12 each side",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 40,
        instructions: "Control the rotation, maintain plank",
        muscleGroups: ["chest", "core", "shoulders"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "High Knees",
        description: "Run in place bringing knees high",
        sets: 4,
        reps: "30 seconds",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 30,
        instructions: "Maintain upright posture, pump arms",
        muscleGroups: ["legs", "core"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Core & Stability Day 7",
    description: "Core strengthening and stability work",
    duration: 40,
    difficulty: "Intermediate",
    category: "Core",
    exercises: [
      {
        name: "Plank",
        description: "Hold plank position",
        sets: 3,
        reps: "60 seconds",
        weight: "Body weight",
        restTime: 60,
        exerciseTime: 60,
        instructions: "Keep body straight, engage core",
        muscleGroups: ["core", "shoulders"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Dead Bug",
        description: "Alternate extending opposite arm and leg",
        sets: 3,
        reps: "10-12 each side",
        weight: "Body weight",
        restTime: 45,
        exerciseTime: 30,
        instructions: "Keep lower back pressed to floor",
        muscleGroups: ["core"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Russian Twists",
        description: "Rotate torso side to side",
        sets: 3,
        reps: "20-25 each side",
        weight: "Body weight + 10-20lbs",
        restTime: 45,
        exerciseTime: 35,
        instructions: "Keep feet off ground, rotate from core",
        muscleGroups: ["obliques", "core"],
        equipment: ["medicine ball", "dumbbell"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Bird Dog",
        description: "Extend opposite arm and leg",
        sets: 3,
        reps: "10-12 each side",
        weight: "Body weight",
        restTime: 30,
        exerciseTime: 25,
        instructions: "Keep hips level, hold position",
        muscleGroups: ["core", "glutes"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Hollow Body Hold",
        description: "Hold hollow body position",
        sets: 3,
        reps: "30-45 seconds",
        weight: "Body weight",
        restTime: 60,
        exerciseTime: 45,
        instructions: "Keep lower back pressed to floor",
        muscleGroups: ["core"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  },
  {
    title: "Active Recovery Day 8",
    description: "Light movement and mobility work",
    duration: 30,
    difficulty: "Beginner",
    category: "Recovery",
    exercises: [
      {
        name: "Walking",
        description: "Light pace walking",
        sets: 1,
        reps: "15-20 minutes",
        weight: "Body weight",
        restTime: 0,
        exerciseTime: 1200,
        instructions: "Maintain comfortable pace, focus on breathing",
        muscleGroups: ["legs", "cardiovascular"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Dynamic Stretching",
        description: "Moving stretches for full body",
        sets: 1,
        reps: "5-10 minutes",
        weight: "Body weight",
        restTime: 0,
        exerciseTime: 600,
        instructions: "Move through full range of motion",
        muscleGroups: ["full body"],
        equipment: ["none"],
        videoUrl: "",
        imageUrl: ""
      },
      {
        name: "Foam Rolling",
        description: "Self-massage with foam roller",
        sets: 1,
        reps: "5-10 minutes",
        weight: "Body weight",
        restTime: 0,
        exerciseTime: 600,
        instructions: "Roll slowly, pause on tight spots",
        muscleGroups: ["full body"],
        equipment: ["foam roller"],
        videoUrl: "",
        imageUrl: ""
      }
    ]
  }
];

async function createFullBodyProgram() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmaker');
    console.log('✅ Connected to MongoDB');

    // Clear existing workouts
    await Workout.deleteMany({});
    console.log('🗑️ Cleared existing workouts');

    // Create workouts
    const createdWorkouts = await Workout.insertMany(workouts);
    console.log(`✅ Created ${createdWorkouts.length} workouts`);

    // Create the 8-day program
    const program = {
      title: "8-Day Full Body Transformation",
      description: "A comprehensive 8-day full body workout program designed to build strength, muscle, and improve overall fitness. This program includes strength training, HIIT, core work, and recovery days to maximize results while preventing overtraining.",
      duration: 8,
      difficulty: "Intermediate",
      assignedTo: {
        tiers: ["foundations", "advanced", "custom"],
        users: []
      },
      tags: ["full-body", "strength", "hiit", "transformation", "8-day"],
      status: "published",
      createdBy: "admin",
      stats: {
        completions: 0,
        averageRating: 0,
        totalRatings: 0
      },
      days: [
        {
          week: 1,
          day: 1,
          workouts: [{ workoutId: createdWorkouts[0]._id, week: 1, day: 1, order: 1 }]
        },
        {
          week: 1,
          day: 2,
          workouts: [{ workoutId: createdWorkouts[1]._id, week: 1, day: 2, order: 1 }]
        },
        {
          week: 1,
          day: 3,
          workouts: [{ workoutId: createdWorkouts[2]._id, week: 1, day: 3, order: 1 }]
        },
        {
          week: 1,
          day: 4,
          workouts: [{ workoutId: createdWorkouts[3]._id, week: 1, day: 4, order: 1 }]
        },
        {
          week: 1,
          day: 5,
          workouts: [{ workoutId: createdWorkouts[4]._id, week: 1, day: 5, order: 1 }]
        },
        {
          week: 1,
          day: 6,
          workouts: [{ workoutId: createdWorkouts[5]._id, week: 1, day: 6, order: 1 }]
        },
        {
          week: 1,
          day: 7,
          workouts: [{ workoutId: createdWorkouts[6]._id, week: 1, day: 7, order: 1 }]
        },
        {
          week: 1,
          day: 8,
          workouts: [{ workoutId: createdWorkouts[7]._id, week: 1, day: 8, order: 1 }]
        }
      ]
    };

    // Clear existing programs
    await Program.deleteMany({});
    console.log('🗑️ Cleared existing programs');

    // Create the program
    const createdProgram = await Program.create(program);
    console.log('✅ Created 8-Day Full Body Transformation program');

    // Display program details
    console.log('\n📋 Program Details:');
    console.log(`Title: ${createdProgram.title}`);
    console.log(`Duration: ${createdProgram.duration} days`);
    console.log(`Difficulty: ${createdProgram.difficulty}`);
    console.log(`Status: ${createdProgram.status}`);
    console.log(`Assigned to tiers: ${createdProgram.assignedTo.tiers.join(', ')}`);
    
    console.log('\n🏋️ Workouts Created:');
    createdWorkouts.forEach((workout, index) => {
      console.log(`Day ${index + 1}: ${workout.title} (${workout.duration} min, ${workout.exercises.length} exercises)`);
    });

    console.log('\n🎉 8-Day Full Body Program created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating program:', error);
    process.exit(1);
  }
}

// Run the program creation
createFullBodyProgram();
