const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    
    const count = await Work.countDocuments({ category: 'Video Editing' });
    console.log(`Found ${count} existing Video Editing documents in MongoDB.`);
    
    if (count > 0) {
      const records = await Work.find({ category: 'Video Editing' });
      records.forEach(r => {
        console.log(`- ID: ${r._id}, Title: ${r.title}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying DB:', error);
    process.exit(1);
  }
};

check();
