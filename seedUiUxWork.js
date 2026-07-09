const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from the local backend directory's .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');
const { getProjectFolder } = require('./utils/cloudinaryFolder');

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    const pathParts = afterUpload.split('/');
    
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    
    const fileWithExt = pathParts.join('/');
    const lastDotIndex = fileWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return fileWithExt.substring(0, lastDotIndex);
    }
    return fileWithExt;
  } catch (e) {
    return null;
  }
};

const uploadToCloudinary = async (filePath, folderPath) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Local image not found: ${filePath}`);
    return null;
  }
  
  console.log(`Uploading "${path.basename(filePath)}" to folder "${folderPath}"...`);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderPath,
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Cloudinary upload failed for ${path.basename(filePath)}:`, error.message);
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

    // 1. Remove Fintech Dashboard Redesign UX / PaySimple document & assets
    const oldDoc = await Work.findOne({ title: "Fintech Dashboard Redesign UX", category: "UI/UX" });
    if (oldDoc) {
      console.log(`🗑️ Removing old Fintech Dashboard document (ID: ${oldDoc._id})...`);
      
      // Delete from Cloudinary if exists
      if (oldDoc.heroImage) {
        const publicId = getPublicIdFromUrl(oldDoc.heroImage);
        if (publicId) {
          console.log(`Deleting Cloudinary asset: ${publicId}`);
          await cloudinary.uploader.destroy(publicId).catch(err => {});
        }
      }
      if (oldDoc.galleryImages) {
        for (const imgUrl of oldDoc.galleryImages) {
          const publicId = getPublicIdFromUrl(imgUrl);
          if (publicId) {
            console.log(`Deleting Cloudinary asset: ${publicId}`);
            await cloudinary.uploader.destroy(publicId).catch(err => {});
          }
        }
      }
      
      await Work.deleteOne({ _id: oldDoc._id });
      console.log('Old Fintech Dashboard document removed.');
    }

    const projectsToSeed = [
      {
        title: "IMS System Designs",
        client: "IMS",
        services: "Figma Design",
        industries: "Pak. Navy Project",
        viewMoreLabel: "IMS",
        viewMoreUrl: "https://www.figma.com/design/NZGTLaU5MJRvlCDh08Yy2C/IMS-SYSTEM?node-id=309-2",
        localImages: ['ims-collage (1).png', 'ims-collage (2).png'],
        description: "Comprehensive administration interface design for Naval systems management."
      },
      {
        title: "HRMS Portal UX",
        client: "HRMS",
        services: "Figma Design",
        industries: "Pak. Navy Project",
        viewMoreLabel: "HRMS",
        viewMoreUrl: "https://www.figma.com/design/NZGTLaU5MJRvlCDh08Yy2C/IMS-SYSTEM?node-id=309-2",
        localImages: ['Hrms-collage (1).png', 'Hrms-collage (2).png'],
        description: "Human resource management system design tailored for enterprise naval operations."
      },
      {
        title: "Give with Hajj UI",
        client: "Give with Hajj",
        services: "Figma Design",
        industries: "Tourism",
        viewMoreLabel: "Give with Hajj",
        viewMoreUrl: "https://www.figma.com/design/UF3jxzJWLiyaRgAX1guWu9/Untitled?node-id=47-10&p=f",
        localImages: ['gowithhajj-collage (1).png', 'gowithhajj-collage (2).png'],
        description: "Elegant user experience design for pilgrimage tourism and booking assistance."
      },
      {
        title: "Brand Tactix Logos",
        client: "LOGO",
        services: "Figma Design",
        industries: "Graphic Designing",
        viewMoreLabel: "LOGO",
        viewMoreUrl: "https://www.figma.com/design/XupBjBYzOj50y5BFxd2wV2/Brand-Tactix?node-id=0-1&p=f",
        localImages: ['logo-collage (1).png', 'logo-collage (2).png'],
        description: "Branding and core visual identity guidelines for enterprise marketing agencies."
      },
      {
        title: "Bfonic Playmate Design",
        client: "Bfonic",
        services: "Figma Design",
        industries: "Social Networking",
        viewMoreLabel: "Bfonic",
        viewMoreUrl: "https://www.figma.com/design/F6DZbcVAmie0zltjHVOvQR/Playmate?node-id=0-1&p=f",
        localImages: ['bfonic-collage (1).png', 'bfonic-collage (2).png'],
        description: "Social networking interface optimized for mobile and desktop connectivity."
      },
      {
        title: "Asfa Personal Portfolio",
        client: "Asfa The Designer",
        services: "Figma Design",
        industries: "Personal Portfolio", // Standardized spelling
        viewMoreLabel: "Asfa The Designer",
        viewMoreUrl: "https://www.figma.com/design/3T9jX4mF5WUkf3EbzNUHk7/portfolio?node-id=1-2",
        localImages: ['asfa-collage  (1).png', 'asfa-collage  (2).png'], // Double space preserved for matching filename
        description: "Bespoke digital canvas design highlighting artistic designs and projects."
      },
      {
        title: "City Cabs App UX",
        client: "City Cabs",
        services: "Figma Design",
        industries: "Riding App",
        viewMoreLabel: "City Cabs",
        viewMoreUrl: "https://www.figma.com/design/brJlebHWVvqUKqqOaMAYw0/Untitled?node-id=0-1&p=f",
        localImages: ['citylab-collage (1).png', 'citylab-collage (2).png'], // Matches local filename
        description: "Intuitive ride-hailing interface design optimizing driver and passenger flows."
      }
    ];

    const categoryName = "UI/UX";
    const sharedTags = ["Figma", "Adobe", "FigJam", "Axure"];
    let seededCount = 0;

    for (const project of projectsToSeed) {
      console.log(`\nProcessing project: "${project.title}"...`);

      // Idempotency check
      const existingDoc = await Work.findOne({ title: project.title, category: categoryName });
      if (existingDoc) {
        console.log(`⏭️ Skipped: "${project.title}" already exists in DB.`);
        continue;
      }

      const newId = new mongoose.Types.ObjectId();
      const folderPath = await getProjectFolder(categoryName, project.title, newId);
      console.log(`Cloudinary directory path: "${folderPath}"`);

      // Upload local images
      const imgUrls = [];
      for (const imgName of project.localImages) {
        const localPath = path.resolve(__dirname, '../new-ask-frontend/img', imgName);
        const uploadedUrl = await uploadToCloudinary(localPath, folderPath);
        if (uploadedUrl) {
          imgUrls.push(uploadedUrl);
        }
      }

      if (imgUrls.length < 2) {
        console.warn(`⚠️ Skipped seeding "${project.title}" due to lack of uploaded images.`);
        continue;
      }

      const workDoc = {
        _id: newId,
        title: project.title,
        category: categoryName,
        client: project.client,
        services: project.services,
        industries: project.industries,
        viewMoreLabel: project.viewMoreLabel,
        viewMoreUrl: project.viewMoreUrl,
        tags: sharedTags,
        description: project.description,
        heroImage: imgUrls[0],
        galleryImages: [imgUrls[1]], // Exactly 2 collage images
        order: seededCount
      };

      await Work.create(workDoc);
      console.log(`✅ Successfully seeded "${project.title}" (ID: ${newId}).`);
      seededCount++;
    }

    const finalCount = await Work.countDocuments({ category: categoryName });
    console.log(`\n🎉 Seeding complete. Total UI/UX items in DB: ${finalCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
