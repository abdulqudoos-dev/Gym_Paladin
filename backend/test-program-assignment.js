const mongoose = require('mongoose');
const User = require('./models/User');
const Program = require('./models/Program');

async function testProgramAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmaker');
    console.log('✅ Connected to MongoDB');

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }

    // Get first program
    const program = await Program.findOne();
    if (!program) {
      console.log('❌ No programs found in database');
      return;
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`📋 Program: ${program.title}`);
    console.log(`🔗 Current assigned program: ${user.assignedProgram}`);

    // Assign program to user
    user.assignedProgram = program._id;
    await user.save();

    console.log('✅ Program assigned successfully!');

    // Verify assignment
    const updatedUser = await User.findById(user._id).populate('assignedProgram', 'title description');
    console.log(`🔗 Updated assigned program: ${updatedUser.assignedProgram?.title || 'None'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing program assignment:', error);
    process.exit(1);
  }
}

// Run the test
testProgramAssignment();
