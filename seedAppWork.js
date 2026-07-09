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

// Load the parsed projects JSON data
const parsedProjectsPath = path.resolve(__dirname, 'parsed_projects.json');
if (!fs.existsSync(parsedProjectsPath)) {
  console.log('Parsed projects JSON not found. Please ensure parsed_projects.json exists in the backend root.');
  process.exit(1);
}

const projectsData = JSON.parse(fs.readFileSync(parsedProjectsPath, 'utf8'));

// Filter only App Development projects
const appProjects = projectsData.filter(p => p.category === 'App Development');

const uploadCache = {}; // Cache to reuse uploaded local images across operations

const uploadToCloudinary = async (localPath, folderPath) => {
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
    console.log('Connected to database successfully.');
    
    let seededCount = 0;
    let skippedCount = 0;
    
    console.log(`Found ${appProjects.length} App Development projects in source list.\n`);

    for (let i = 0; i < appProjects.length; i++) {
      const p = appProjects[i];
      const cleanedTitle = p.title.replace(/\s+/g, ' ').trim();
      const cleanedClient = p.client.replace(/\s+/g, ' ').trim();
      
      console.log(`[${i+1}/${appProjects.length}] Checking project: "${cleanedTitle}"...`);
      
      // Idempotency Check: search by title and category
      const existingDoc = await Work.findOne({ title: cleanedTitle, category: 'App Development' });
      if (existingDoc) {
        console.log(`⏭️ Skipped (already exists in MongoDB with ID: ${existingDoc._id})`);
        skippedCount++;
        continue;
      }
      
      console.log(`🚀 Seeding new project for client: ${cleanedClient}...`);
      
      // Generate object ID and target nested folder path
      const newId = new mongoose.Types.ObjectId();
      const folderPath = await getProjectFolder('App Development', cleanedClient || cleanedTitle, newId);
      
      // Set hero image to first image in list, if any
      let heroImage = '';
      if (p.images && p.images.length > 0) {
        const url = await uploadToCloudinary(p.images[0], folderPath);
        if (url) heroImage = url;
      }
      
      // Upload remaining images to gallery (preserving original order)
      const galleryImages = [];
      if (p.images && p.images.length > 1) {
        for (let j = 1; j < p.images.length; j++) {
          const url = await uploadToCloudinary(p.images[j], folderPath);
          if (url) galleryImages.push(url);
        }
      }
      
      const cleanedServices = p.services.replace(/\s+/g, ' ').trim();
      const cleanedIndustries = p.industries.replace(/\s+/g, ' ').trim();
      const cleanedTags = p.tags.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
      
      const workDoc = {
        _id: newId,
        title: cleanedTitle,
        category: 'App Development',
        client: cleanedClient,
        services: cleanedServices,
        industries: cleanedIndustries,
        tags: cleanedTags,
        viewMoreLabel: p.viewMoreLabel.replace(/\s+/g, ' ').trim() || cleanedClient,
        viewMoreUrl: p.viewMoreUrl,
        description: `Experience ASK Websolutions premium App Development services customized for ${cleanedClient}. Built with state-of-the-art tech.`,
        heroImage,
        galleryImages,
        order: i
      };
      
      await Work.create(workDoc);
      seededCount++;
      console.log(`✅ Successfully seeded: "${cleanedTitle}"`);
    }
    
    console.log(`\n=== SEEDING SUMMARY ===`);
    console.log(`Total App Development Projects Processed: ${appProjects.length}`);
    console.log(`Successfully Seeded: ${seededCount}`);
    console.log(`Skipped (Already Exist): ${skippedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
