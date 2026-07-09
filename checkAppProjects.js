const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');

const checkDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Find App Development projects
    const appProjects = await Work.find({ category: 'App Development' });
    console.log(`\nFound ${appProjects.length} App Development projects in MongoDB:\n`);
    appProjects.forEach(p => {
      console.log(`- ${p.title}`);
      console.log(`  Hero image: ${p.heroImage ? p.heroImage.substring(0, 80) + '...' : 'NO HERO'}`);
      console.log(`  Gallery: ${p.galleryImages.length} images\n`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
};

checkDB();
