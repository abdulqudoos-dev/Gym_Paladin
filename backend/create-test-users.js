const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const testUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'customer',
    subscription: {
      plan: 'foundations',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    profile: {
      age: 28,
      height: 175,
      weight: 75,
      fitnessLevel: 'intermediate',
      goals: ['muscle_gain', 'strength']
    },
    stats: {
      totalWorkouts: 15,
      currentStreak: 5,
      longestStreak: 12,
      lastWorkoutDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'customer',
    subscription: {
      plan: 'advanced',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    profile: {
      age: 32,
      height: 165,
      weight: 60,
      fitnessLevel: 'advanced',
      goals: ['weight_loss', 'endurance']
    },
    stats: {
      totalWorkouts: 45,
      currentStreak: 8,
      longestStreak: 20,
      lastWorkoutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    role: 'customer',
    subscription: {
      plan: 'free',
      status: 'inactive',
      startDate: null,
      endDate: null
    },
    profile: {
      age: 25,
      height: 180,
      weight: 80,
      fitnessLevel: 'beginner',
      goals: ['general_fitness']
    },
    stats: {
      totalWorkouts: 3,
      currentStreak: 0,
      longestStreak: 3,
      lastWorkoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    }
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'customer',
    subscription: {
      plan: 'custom',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    profile: {
      age: 29,
      height: 170,
      weight: 65,
      fitnessLevel: 'advanced',
      goals: ['muscle_gain', 'strength', 'flexibility']
    },
    stats: {
      totalWorkouts: 60,
      currentStreak: 15,
      longestStreak: 25,
      lastWorkoutDate: new Date() // today
    }
  },
  {
    name: 'Admin User',
    email: 'admin@fitmaker.com',
    password: 'admin123',
    role: 'admin',
    subscription: {
      plan: 'custom',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    },
    profile: {
      age: 35,
      height: 185,
      weight: 85,
      fitnessLevel: 'advanced',
      goals: ['strength', 'muscle_gain']
    },
    stats: {
      totalWorkouts: 100,
      currentStreak: 30,
      longestStreak: 50,
      lastWorkoutDate: new Date()
    }
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmaker');
    console.log('✅ Connected to MongoDB');

    // Clear existing users (except keep admin if exists)
    await User.deleteMany({ role: 'customer' });
    console.log('🗑️ Cleared existing customer users');

    // Hash passwords and create users
    const createdUsers = [];
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} test users`);

    // Display created users
    createdUsers.forEach(user => {
      console.log(`👤 ${user.name} (${user.email}) - ${user.role} - ${user.subscription.plan} plan`);
    });

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@fitmaker.com / admin123');
    console.log('Customer: john@example.com / password123');
    console.log('Customer: jane@example.com / password123');
    console.log('Customer: mike@example.com / password123');
    console.log('Customer: sarah@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

// Run the user creation
createTestUsers();
