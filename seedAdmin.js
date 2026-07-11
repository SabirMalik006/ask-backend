const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = 'Admin';

    if (!email || !password) {
      console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
      process.exit(1);
    }

    const existing = await User.findOne({ email });

    if (existing) {
      existing.name = name;
      existing.password = password;
      existing.role = 'admin';
      await existing.save();
      console.log(`Admin user updated: ${email}`);
    } else {
      await User.create({ name, email, password, role: 'admin' });
      console.log(`Admin user created: ${email}`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
