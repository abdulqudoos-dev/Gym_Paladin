const mongoose = require('mongoose');
const Program = require('./models/Program');

const samplePrograms = [
  {
    title: "Beginner Strength Foundation",
    description: "A comprehensive 8-week program designed for beginners to build strength, improve form, and establish healthy workout habits. Perfect for those new to weight training.",
    duration: 8,
    difficulty: "Beginner",
    assignedTo: {
      tiers: ["free", "foundations"],
      users: []
    },
    tags: ["strength", "beginner", "foundation", "weight-training"],
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
        workouts: []
      },
      {
        week: 1,
        day: 3,
        workouts: []
      },
      {
        week: 1,
        day: 5,
        workouts: []
      }
    ]
  },
  {
    title: "Advanced Powerlifting Program",
    description: "A 12-week intensive powerlifting program for experienced lifters looking to maximize their squat, bench press, and deadlift. Includes periodization and advanced techniques.",
    duration: 12,
    difficulty: "Advanced",
    assignedTo: {
      tiers: ["advanced", "custom"],
      users: []
    },
    tags: ["powerlifting", "advanced", "strength", "competition"],
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
        workouts: []
      },
      {
        week: 1,
        day: 3,
        workouts: []
      },
      {
        week: 1,
        day: 5,
        workouts: []
      }
    ]
  },
  {
    title: "Fat Loss Transformation",
    description: "A 6-week high-intensity program combining strength training and cardio to maximize fat loss while preserving muscle mass. Includes nutrition guidelines.",
    duration: 6,
    difficulty: "Intermediate",
    assignedTo: {
      tiers: ["foundations", "advanced"],
      users: []
    },
    tags: ["fat-loss", "cardio", "strength", "transformation"],
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
        workouts: []
      },
      {
        week: 1,
        day: 2,
        workouts: []
      },
      {
        week: 1,
        day: 4,
        workouts: []
      },
      {
        week: 1,
        day: 5,
        workouts: []
      }
    ]
  },
  {
    title: "Bodyweight Mastery",
    description: "A 10-week progressive bodyweight program that takes you from basic movements to advanced calisthenics. No equipment needed!",
    duration: 10,
    difficulty: "Intermediate",
    assignedTo: {
      tiers: ["free", "foundations"],
      users: []
    },
    tags: ["bodyweight", "calisthenics", "progressive", "no-equipment"],
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
        workouts: []
      },
      {
        week: 1,
        day: 3,
        workouts: []
      },
      {
        week: 1,
        day: 5,
        workouts: []
      }
    ]
  },
  {
    title: "Elite Athlete Conditioning",
    description: "A 16-week elite-level conditioning program designed for competitive athletes. Includes sport-specific training, recovery protocols, and performance metrics.",
    duration: 16,
    difficulty: "Advanced",
    assignedTo: {
      tiers: ["custom"],
      users: []
    },
    tags: ["elite", "athletic", "conditioning", "performance"],
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
        workouts: []
      },
      {
        week: 1,
        day: 2,
        workouts: []
      },
      {
        week: 1,
        day: 4,
        workouts: []
      },
      {
        week: 1,
        day: 5,
        workouts: []
      },
      {
        week: 1,
        day: 6,
        workouts: []
      }
    ]
  }
];

async function seedPrograms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmaker');
    console.log('✅ Connected to MongoDB');

    // Clear existing programs
    await Program.deleteMany({});
    console.log('🗑️ Cleared existing programs');

    // Insert sample programs
    const createdPrograms = await Program.insertMany(samplePrograms);
    console.log(`✅ Created ${createdPrograms.length} sample programs`);

    // Display created programs
    createdPrograms.forEach(program => {
      console.log(`📋 ${program.title} - ${program.difficulty} (${program.duration} weeks)`);
    });

    console.log('🎉 Program seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding programs:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedPrograms();
