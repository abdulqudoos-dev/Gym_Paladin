require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@fitmaker.com' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@fitmaker.com',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@fitmaker.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createAdmin();
