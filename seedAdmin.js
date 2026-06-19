const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

delete process.env.MONGO_URI;
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const userExists = await User.findOne({ email: 'admin@askwebsolutions.com' });
    
    if (userExists) {
      console.log('Admin already exists!');
      process.exit();
    }

    const user = await User.create({
      name: 'Admin',
      email: 'admin@askwebsolutions.com',
      password: 'password123',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Password: password123');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
