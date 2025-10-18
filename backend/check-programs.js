const mongoose = require('mongoose');
const Program = require('./models/Program');

async function checkPrograms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmaker');
    console.log('✅ Connected to MongoDB');

    // Check if programs exist
    const programs = await Program.find();
    console.log(`📋 Found ${programs.length} programs in database`);
    
    if (programs.length > 0) {
      console.log('\n📋 Programs:');
      programs.forEach((program, index) => {
        console.log(`${index + 1}. ${program.title} - ${program.status} - ${program.duration} days`);
      });
    } else {
      console.log('❌ No programs found in database');
      console.log('💡 Run: node create-8day-program.js to create programs');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking programs:', error);
    process.exit(1);
  }
}

// Run the check
checkPrograms();
