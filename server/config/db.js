const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vastusetu');
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);

    // Automatically check whether an Admin account exists.
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('👤 No admin account found. Creating default admin...');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('ADM123456', salt);
      await User.create({
        name: 'Super Admin',
        email: 'admin@vastusetu.com',
        password: hashedPassword,
        plainPassword: 'ADM123456',
        role: 'admin',
        phone: '1234567890'
      });
      console.log('✅ Default Admin created: Super Admin (admin@vastusetu.com / ADM123456)');
    } else {
      console.log('👤 Admin account already exists. Skipping default creation.');
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
