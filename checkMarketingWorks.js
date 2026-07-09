const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const Work = require('./models/Work');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const marketingWorks = await Work.find({ category: 'Digital Marketing' });
    console.log(`Found ${marketingWorks.length} Digital Marketing works:`);
    marketingWorks.forEach((w, i) => {
      console.log(`[${i+1}] Title: "${w.title}" | Client: "${w.client || 'N/A'}"`);
      console.log(`    Platforms: "${w.platforms || 'N/A'}"`);
      console.log(`    Content & Strategy: "${w.contentStrategy || 'N/A'}"`);
      console.log(`    Service List:`, w.serviceList);
      console.log(`    Hero Image: "${w.heroImage || 'N/A'}"`);
      console.log(`    Gallery Images Count: ${w.galleryImages ? w.galleryImages.length : 0}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
