const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from the parent directory's .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');
const { getProjectFolder } = require('./utils/cloudinaryFolder');

const uploadCache = {};

const uploadToCloudinary = async (filePathOrUrl, folderPath, isVideo = false) => {
  if (!filePathOrUrl) return '';

  let absPath = filePathOrUrl;
  let isRemote = false;

  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    isRemote = true;
  } else {
    // Resolve local path relative to frontend directory
    let relPath = filePathOrUrl;
    if (relPath.startsWith('./')) {
      relPath = relPath.substring(2);
    }
    absPath = path.resolve(__dirname, '../new-ask-frontend', relPath);
    if (!fs.existsSync(absPath)) {
      console.warn(`⚠️ File not found: ${absPath}`);
      return null;
    }
  }

  const cacheKey = `${absPath}::${folderPath}`;
  if (uploadCache[cacheKey]) {
    return uploadCache[cacheKey];
  }

  console.log(`Uploading ${isRemote ? 'remote URL' : 'local file'} "${filePathOrUrl}" to Cloudinary folder "${folderPath}" (${isVideo ? 'video' : 'image'})...`);
  try {
    const options = {
      folder: folderPath,
      resource_type: isVideo ? 'video' : 'image'
    };
    
    // For large video uploads, we can use uploader.upload which is standard for small assets, 
    // or uploader.upload_large for extremely large files.
    // video 2.mp4 and video 3.mp4 are small theme videos, so upload is perfect.
    const result = await cloudinary.uploader.upload(absPath, options);
    uploadCache[cacheKey] = result.secure_url;
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePathOrUrl}:`, error.message);
    return null;
  }
};

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from env file');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database successfully.\n');

    const projectTitle = "E-commerce Solutions";
    const categoryName = "E-commerce";

    // Idempotency check
    const existingDoc = await Work.findOne({ title: projectTitle, category: categoryName });
    if (existingDoc) {
      console.log(`⏭️ Skipped: E-commerce Solutions placeholder document already exists (ID: ${existingDoc._id}).`);
      process.exit(0);
    }

    const newId = new mongoose.Types.ObjectId();
    const folderPath = await getProjectFolder(categoryName, projectTitle, newId);
    console.log(`Target Cloudinary folder: "${folderPath}"`);

    // Define the sequence of placeholder media matching the grid
    const rawMediaList = [
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' },
      { type: 'video', path: './videos/video 2.mp4', posterPath: '' },
      { type: 'video', path: './videos/video 3.mp4', posterPath: './img/poster 1.jpeg' },
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' },
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' },
      { type: 'video', path: './videos/video 2.mp4', posterPath: '' },
      { type: 'video', path: './videos/video 3.mp4', posterPath: './img/poster 1.jpeg' },
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' },
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' },
      { type: 'video', path: './videos/video 2.mp4', posterPath: '' },
      { type: 'video', path: './videos/video 3.mp4', posterPath: './img/poster 1.jpeg' },
      { type: 'image', path: 'https://dummyimage.com/1200x1200/4d4d4d/838383' }
    ];

    const uploadedMedia = [];
    
    console.log('Uploading media files to Cloudinary...');
    for (let i = 0; i < rawMediaList.length; i++) {
      const item = rawMediaList[i];
      console.log(`[Media ${i+1}/${rawMediaList.length}] Processing type: ${item.type}...`);
      
      const isVideo = item.type === 'video';
      const uploadedUrl = await uploadToCloudinary(item.path, folderPath, isVideo);
      
      if (!uploadedUrl) {
        console.warn(`⚠️ Skipped media index ${i} due to upload failure.`);
        continue;
      }

      let uploadedPosterUrl = '';
      if (isVideo && item.posterPath) {
        const posterUrl = await uploadToCloudinary(item.posterPath, folderPath, false);
        if (posterUrl) uploadedPosterUrl = posterUrl;
      }

      uploadedMedia.push({
        type: item.type,
        url: uploadedUrl,
        poster: uploadedPosterUrl || undefined
      });
    }

    console.log('\nCreating Work document...');
    const ecomWork = {
      _id: newId,
      title: projectTitle,
      category: categoryName,
      client: "ASK Websolutions",
      services: "E-commerce Solutions",
      platforms: "Shopify, Amazon, eBay, Walmart",
      businessSetup: "LLC / LTD Registration",
      businessModels: "FBA, FBM, Dropshipping",
      tags: ["Shopify", "Amazon", "eBay", "FBA / FBM", "Dropshipping", "LLC / LTD", "Product Hunting"],
      description: "Strategic e-commerce solutions designed to launch, grow, and optimize profitable online businesses worldwide.",
      media: uploadedMedia,
      // Fallback fields (will point to hero and gallery images for backward compatibility if needed)
      heroImage: uploadedMedia.length > 0 ? uploadedMedia[0].url : '',
      galleryImages: uploadedMedia.slice(1).map(m => m.url),
      order: 0
    };

    const doc = await Work.create(ecomWork);
    console.log(`✅ Successfully seeded E-commerce Solutions document (ID: ${doc._id}).`);
    
    // Verify document counts
    const totalDocs = await Work.countDocuments({ category: 'E-commerce' });
    console.log(`Total E-commerce items in DB: ${totalDocs}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
