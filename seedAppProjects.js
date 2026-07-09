const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');

// Load all parsed projects
const parsedProjectsPath = path.resolve(__dirname, 'parsed_projects.json');
if (!fs.existsSync(parsedProjectsPath)) {
  console.error('Parsed projects JSON not found!');
  process.exit(1);
}

const allProjects = JSON.parse(fs.readFileSync(parsedProjectsPath, 'utf8'));
const appProjects = allProjects.filter(p => p.category === 'App Development');

const uploadCache = {};

const uploadToCloudinary = async (localPath) => {
  let relPath = localPath;
  if (relPath.startsWith('./')) relPath = relPath.substring(2);

  const absPath = path.resolve(__dirname, '../new-ask-frontend', relPath);

  if (!fs.existsSync(absPath)) {
    console.warn(`File not found: ${absPath}`);
    return null;
  }

  if (uploadCache[absPath]) return uploadCache[absPath];

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

    let seededCount = 0;
    for (let i = 0; i < appProjects.length; i++) {
      const p = appProjects[i];
      console.log(`[${i+1}/${appProjects.length}] Processing project: ${p.title}...`);

      // Check if project already exists
      const existing = await Work.findOne({ 
        title: p.title.replace(/\s+/g, ' ').trim(),
        category: 'App Development'
      });

      if (existing) {
        console.log(`  Project already exists! Skipping...`);
        continue;
      }

      // Upload images
      let heroImage = '';
      if (p.images && p.images.length > 0) {
        const url = await uploadToCloudinary(p.images[0]);
        if (url) heroImage = url;
      }

      const galleryImages = [];
      if (p.images && p.images.length > 0) {
        for (const imgPath of p.images) {
          const url = await uploadToCloudinary(imgPath);
          if (url) galleryImages.push(url);
        }
      }

      // Clean fields
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
      console.log(`Successfully seeded: ${workDoc.title}`);
    }

    console.log(`\n✅ Seeding complete! Seeded ${seededCount} App Development projects.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
