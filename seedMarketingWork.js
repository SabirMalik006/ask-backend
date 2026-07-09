const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');
const { getProjectFolder } = require('./utils/cloudinaryFolder');

const localImages = [
  './img/marketing image 2.png', // first in collage, makes a good hero
  './img/marketing image 1.png',
  './img/marketing image 3.png',
  './img/marketing image 4.jpeg',
  './img/marketing image 5.jpeg',
  './img/marketing image 6.jpeg',
  './img/marketing image 7.jpeg',
  './img/marketing image 8.jpeg',
  './img/marketing image 9.jpeg',
  './img/marketing image 10.jpeg',
  './img/marketing image 11.jpeg',
  './img/marketing image 12.jpeg',
  './img/marketing image 13.jpeg',
  './img/marketing image 14.jpeg',
  './img/marketing image 15.jpeg',
  './img/marketing image 16.jpeg'
];

const uploadToCloudinary = async (localPath, folderPath) => {
  let relPath = localPath;
  if (relPath.startsWith('./')) {
    relPath = relPath.substring(2);
  }
  const absPath = path.resolve(__dirname, '../new-ask-frontend', relPath);
  
  if (!fs.existsSync(absPath)) {
    console.warn(`⚠️ File not found: ${absPath}`);
    return null;
  }
  
  console.log(`Uploading ${localPath} to Cloudinary folder "${folderPath}"...`);
  try {
    const result = await cloudinary.uploader.upload(absPath, {
      folder: folderPath
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return null;
  }
};

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database.');

    const title = 'Digital Marketing Portfolio';
    const client = 'ASK Websolutions';

    // Idempotency check
    const existing = await Work.findOne({ title, category: 'Digital Marketing' });
    if (existing) {
      console.log(`⏭️ Skipped: "${title}" already exists in MongoDB with ID: ${existing._id}`);
      process.exit(0);
    }

    const newId = new mongoose.Types.ObjectId();
    const folderPath = await getProjectFolder('Digital Marketing', client || title, newId);

    // Upload Hero Image
    console.log('Uploading hero image...');
    const heroImage = await uploadToCloudinary(localImages[0], folderPath);

    // Upload Gallery Images
    const galleryImages = [];
    console.log('Uploading gallery images...');
    for (let i = 1; i < localImages.length; i++) {
      const url = await uploadToCloudinary(localImages[i], folderPath);
      if (url) {
        galleryImages.push(url);
      }
    }

    const workDoc = {
      _id: newId,
      title,
      category: 'Digital Marketing',
      client,
      platforms: 'Facebook, Instagram, TikTok, Google, YouTube',
      contentStrategy: 'Brand Growth & Online Presence',
      serviceList: [
        'Social Media Marketing',
        'Paid Advertising',
        'Content Marketing',
        'Lead Generation'
      ],
      tags: [
        'Meta Ads',
        'Google Ads',
        'TikTok Ads',
        'LinkedIn Ads',
        'Snapchat Ads',
        'SEO / SMM',
        'Email Marketing'
      ],
      description: 'Strategic digital marketing solutions designed to grow brands, increase visibility, and drive targeted traffic across multiple online platforms.',
      heroImage,
      galleryImages,
      order: 0
    };

    await Work.create(workDoc);
    console.log(`✅ Successfully seeded: "${title}" in MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

runSeed();
