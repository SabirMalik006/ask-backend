const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');

// Load the parsed projects
const parsedProjectsPath = path.resolve(__dirname, 'parsed_projects.json');
if (!fs.existsSync(parsedProjectsPath)) {
  console.error('Parsed projects JSON not found. Run parseHtmlProjects.js first.');
  process.exit(1);
}

const projectsData = JSON.parse(fs.readFileSync(parsedProjectsPath, 'utf8'));

const uploadCache = {}; // Cache local image paths to Cloudinary URLs

const uploadToCloudinary = async (localPath) => {
  // Normalize path
  let relPath = localPath;
  if (relPath.startsWith('./')) {
    relPath = relPath.substring(2);
  }
  
  // Resolve absolute path in the frontend directory
  const absPath = path.resolve(__dirname, '../new-ask-frontend', relPath);
  
  if (!fs.existsSync(absPath)) {
    console.warn(`File not found: ${absPath}`);
    return null;
  }
  
  if (uploadCache[absPath]) {
    return uploadCache[absPath];
  }
  
  console.log(`Uploading ${localPath} to Cloudinary...`);
  try {
    const result = await cloudinary.uploader.upload(absPath, {
      folder: 'portfolio_works'
    });
    uploadCache[absPath] = result.secure_url;
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${localPath}:`, error.message);
    return null;
  }
};

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database.');
    
    console.log('Clearing existing works...');
    await Work.deleteMany({});
    console.log('Cleared existing works.');
    
    try {
      console.log('Dropping old slug_1 index...');
      await Work.collection.dropIndex('slug_1');
      console.log('Successfully dropped old slug_1 index.');
    } catch (e) {
      console.log('slug_1 index did not exist or could not be dropped.');
    }
    
    let seededCount = 0;
    for (let i = 0; i < projectsData.length; i++) {
      const p = projectsData[i];
      console.log(`[${i+1}/${projectsData.length}] Processing project for client: ${p.client}...`);
      
      // Upload hero image (first image in the list, if any)
      let heroImage = '';
      if (p.images && p.images.length > 0) {
        const url = await uploadToCloudinary(p.images[0]);
        if (url) heroImage = url;
      }
      
      // Upload gallery images
      const galleryImages = [];
      if (p.images && p.images.length > 0) {
        for (const imgPath of p.images) {
          const url = await uploadToCloudinary(imgPath);
          if (url) galleryImages.push(url);
        }
      }
      
      // Clean texts from extra spacing
      const cleanedClient = p.client.replace(/\s+/g, ' ').trim();
      const cleanedServices = p.services.replace(/\s+/g, ' ').trim();
      const cleanedIndustries = p.industries.replace(/\s+/g, ' ').trim();
      const cleanedTags = p.tags.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
      
      const workDoc = {
        title: p.title.replace(/\s+/g, ' ').trim(),
        category: p.category,
        client: cleanedClient,
        services: cleanedServices,
        industries: cleanedIndustries,
        tags: cleanedTags,
        viewMoreLabel: p.viewMoreLabel.replace(/\s+/g, ' ').trim(),
        viewMoreUrl: p.viewMoreUrl,
        description: `Experience ASK Websolutions premium ${p.category} services customized for ${cleanedClient}. Built with state-of-the-art tech.`,
        heroImage,
        galleryImages,
        order: i
      };
      
      await Work.create(workDoc);
      seededCount++;
      console.log(`Successfully seeded work item for ${cleanedClient}`);
    }
    
    console.log(`\n✅ Seeding completed. Successfully seeded ${seededCount} works.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
