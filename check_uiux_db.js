const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Work = require('./models/Work');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    
    const count = await Work.countDocuments({ category: 'UI/UX' });
    console.log(`Found ${count} existing UI/UX documents in MongoDB.`);
    
    if (count > 0) {
      const records = await Work.find({ category: 'UI/UX' });
      records.forEach(r => {
        console.log(`- ID: ${r._id}, Title: ${r.title}, Client: ${r.client}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying DB:', error);
    process.exit(1);
  }
};

check();
