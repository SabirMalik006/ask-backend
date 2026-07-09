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

// Path to the parsed JSON report generated during audit
const parsedDataPath = 'C:/Users/riazm/.gemini/antigravity-ide/brain/de132816-bc5f-44fd-a87b-63721ff9dfce/scratch/parsed_graphic_projects.json';
if (!fs.existsSync(parsedDataPath)) {
  console.error(`❌ Parsed data file not found at: ${parsedDataPath}`);
  process.exit(1);
}

const { projects, otherCreativesImages } = JSON.parse(fs.readFileSync(parsedDataPath, 'utf8'));

const uploadCache = {};

const uploadToCloudinary = async (localPath, folderPath) => {
  if (!localPath) return '';
  
  // Normalize path format
  let relPath = localPath;
  if (relPath.startsWith('./')) {
    relPath = relPath.substring(2);
  }
  
  // Resolve absolute path relative to the frontend directory
  const absPath = path.resolve(__dirname, '../new-ask-frontend', relPath);
  
  if (!fs.existsSync(absPath)) {
    console.warn(`⚠️ File not found: ${absPath}`);
    return null;
  }
  
  const cacheKey = `${absPath}::${folderPath}`;
  if (uploadCache[cacheKey]) {
    return uploadCache[cacheKey];
  }
  
  console.log(`Uploading ${localPath} to Cloudinary folder "${folderPath}"...`);
  try {
    const result = await cloudinary.uploader.upload(absPath, {
      folder: folderPath
    });
    uploadCache[cacheKey] = result.secure_url;
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
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
    
    let seededCount = 0;
    let skippedCount = 0;
    
    const standardTags = ["Adobe Photoshop", "Adobe Illustrator", "Canva", "After Effects", "Photoshop", "CorelDRAW"];

    // =========================================================================
    // 1. Seed standard graphic design projects
    // =========================================================================
    console.log(`=== Seeding ${projects.length} Standard Graphic Designing Projects ===`);
    
    // Clean up old collided doc
    await Work.deleteMany({ title: 'Mr. Subhan Mehmood', category: 'Graphic Designing' });

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const cleanedClient = p.client.replace(/\s+/g, ' ').trim();
      
      // Make title unique if client is Mr. Subhan Mehmood to prevent collisions
      const cleanedTitle = (cleanedClient === 'Mr. Subhan Mehmood') 
        ? `${cleanedClient} (${p.viewMoreLabel.replace(/\s+/g, ' ').trim()})` 
        : cleanedClient;
      
      console.log(`[${i+1}/${projects.length}] Checking project for: "${cleanedTitle}"...`);
      
      // Idempotency check: title + category
      const existingDoc = await Work.findOne({ title: cleanedTitle, category: 'Graphic Designing' });
      if (existingDoc) {
        console.log(`⏭️ Skipped (already exists in MongoDB with ID: ${existingDoc._id})`);
        skippedCount++;
        continue;
      }
      
      console.log(`🚀 Seeding project for client: "${cleanedClient}"...`);
      
      // Generate ID and project-specific Cloudinary folder path
      const newId = new mongoose.Types.ObjectId();
      const folderPath = await getProjectFolder('Graphic Designing', cleanedClient, newId);
      
      // Upload images in order
      let heroImage = '';
      if (p.images && p.images.length > 0) {
        const url = await uploadToCloudinary(p.images[0], folderPath);
        if (url) heroImage = url;
      }
      
      const galleryImages = [];
      if (p.images && p.images.length > 1) {
        for (let j = 1; j < p.images.length; j++) {
          const url = await uploadToCloudinary(p.images[j], folderPath);
          if (url) galleryImages.push(url);
        }
      }
      
      // Fix Services mismatch: change "Web development" to "Designing & Social Media Management"
      let finalServices = p.services.replace(/\s+/g, ' ').trim();
      if (finalServices === 'Web development') {
        finalServices = 'Designing & Social Media Management';
      }
      
      const cleanedIndustries = p.industries.replace(/\s+/g, ' ').trim();
      
      const workDoc = {
        _id: newId,
        title: cleanedTitle,
        category: 'Graphic Designing',
        client: cleanedClient,
        services: finalServices,
        industries: cleanedIndustries,
        tags: standardTags,
        viewMoreLabel: p.viewMoreLabel.replace(/\s+/g, ' ').trim() || cleanedClient,
        viewMoreUrl: p.viewMoreUrl,
        description: `Premium graphic design solutions and creative social media content customized for ${cleanedClient}. Crafted with Adobe Photoshop, Illustrator, and Canva.`,
        heroImage,
        galleryImages,
        order: i,
        isOtherCreatives: false
      };
      
      await Work.create(workDoc);
      seededCount++;
      console.log(`✅ Successfully seeded standard project: "${cleanedTitle}"`);
    }

    // =========================================================================
    // 2. Seed "Other Creatives" as a single work item
    // =========================================================================
    console.log('\n=== Seeding "Other Creatives" Portfolio Section ===');
    const otherCreativesTitle = "Other Creatives";
    
    // Idempotency check for Other Creatives
    const existingOtherCreatives = await Work.findOne({ title: otherCreativesTitle, category: 'Graphic Designing', isOtherCreatives: true });
    if (existingOtherCreatives) {
      console.log(`⏭️ Skipped Other Creatives (already exists in MongoDB with ID: ${existingOtherCreatives._id})`);
      skippedCount++;
    } else {
      console.log('🚀 Seeding "Other Creatives" single work document...');
      const newId = new mongoose.Types.ObjectId();
      const folderPath = 'work/graphic-designing/other-creatives';
      
      // Filter out templates/cta graphics and seed only creative image assets
      const creativeAssets = otherCreativesImages.filter(img => img.includes('creative'));
      console.log(`Found ${creativeAssets.length} creative image files to upload.`);
      
      let heroImage = '';
      if (creativeAssets.length > 0) {
        const url = await uploadToCloudinary(creativeAssets[0], folderPath);
        if (url) heroImage = url;
      }
      
      const galleryImages = [];
      if (creativeAssets.length > 1) {
        for (let j = 1; j < creativeAssets.length; j++) {
          const url = await uploadToCloudinary(creativeAssets[j], folderPath);
          if (url) galleryImages.push(url);
        }
      }
      
      const otherCreativesDoc = {
        _id: newId,
        title: otherCreativesTitle,
        category: 'Graphic Designing',
        client: 'ASK Websolutions',
        services: 'Designing & Social Media Management',
        industries: 'Creative Portfolio',
        tags: standardTags,
        viewMoreLabel: 'ASK Websolutions',
        viewMoreUrl: 'https://www.instagram.com/askwebsolutions',
        description: 'A curated collection of branding designs, digital templates, and artistic flyers developed by ASK Websolutions.',
        heroImage,
        galleryImages,
        order: projects.length, // Put it at the end of the order
        isOtherCreatives: true
      };
      
      await Work.create(otherCreativesDoc);
      seededCount++;
      console.log(`✅ Successfully seeded "Other Creatives" single document.`);
    }

    console.log(`\n=== SEEDING SUMMARY ===`);
    console.log(`Total Graphic Designing Items Processed: ${projects.length + 1}`);
    console.log(`Successfully Seeded: ${seededCount}`);
    console.log(`Skipped (Already Exist): ${skippedCount}`);
    
    // Output database count of Graphic Designing category documents
    const totalDocs = await Work.countDocuments({ category: 'Graphic Designing' });
    console.log(`Total documents in DB under "Graphic Designing" category: ${totalDocs}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
