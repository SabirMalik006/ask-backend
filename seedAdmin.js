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
      userExists.password = 'password 123';
      await userExists.save();
      console.log('Admin already existed, password updated to password 123 successfully!');
      process.exit();
    }

    const user = await User.create({
      name: 'Admin',
      email: 'admin@askwebsolutions.com',
      password: 'password 123',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Password: password 123');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
