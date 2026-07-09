const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');
const { getProjectFolder } = require('./utils/cloudinaryFolder');

/**
 * Helper to extract public ID from a Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    const pathParts = afterUpload.split('/');
    
    // Shift version if it exists
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
    console.error('Error parsing Cloudinary URL:', e);
    return null;
  }
};

/**
 * Helper to construct new URL from old URL and new public ID
 */
const getNewUrlFromOldUrl = (oldUrl, newPublicId) => {
  const parts = oldUrl.split('/upload/');
  if (parts.length < 2) return oldUrl;
  
  // Clean version segment (remove it or keep it, let's keep it clean without version to avoid caching issues)
  return `${parts[0]}/upload/${newPublicId}`;
};

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from env file');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database successfully.');

    const works = await Work.find({});
    console.log(`Found ${works.length} total work items to migrate.`);

    let migratedCount = 0;

    for (let i = 0; i < works.length; i++) {
      const w = works[i];
      console.log(`\n[${i+1}/${works.length}] Migrating work item: "${w.title}" (${w.category})`);

      const folderPath = await getProjectFolder(w.category, w.client || w.title, w._id);
      console.log(`Target folder: "${folderPath}"`);

      let updated = false;

      // Migrate Hero Image
      if (w.heroImage) {
        const oldPublicId = getPublicIdFromUrl(w.heroImage);
        if (oldPublicId) {
          const filename = path.basename(oldPublicId);
          // If already in the target subfolder, use it directly. Otherwise, form new public ID.
          const isAlreadyRenamed = oldPublicId.startsWith(`${folderPath}/`);
          const newPublicId = isAlreadyRenamed ? oldPublicId : `${folderPath}/${filename}`;
          
          if (oldPublicId !== newPublicId) {
            console.log(`Renaming hero image: "${oldPublicId}" -> "${newPublicId}"`);
            try {
              await cloudinary.uploader.rename(oldPublicId, newPublicId, { overwrite: true });
              w.heroImage = getNewUrlFromOldUrl(w.heroImage, newPublicId);
              updated = true;
            } catch (renameErr) {
              console.error(`❌ Failed to rename hero image: ${renameErr.message}`);
            }
          }
          
          // Ensure it's visually moved to the target folder in the Media Library
          console.log(`Setting asset_folder for hero image: "${newPublicId}" -> "${folderPath}"`);
          try {
            await cloudinary.api.update(newPublicId, { asset_folder: folderPath });
          } catch (updateErr) {
            console.error(`❌ Failed to update asset_folder: ${updateErr.message}`);
          }
        }
      }

      // Migrate Gallery Images
      const newGalleryImages = [];
      for (let j = 0; j < w.galleryImages.length; j++) {
        const imgUrl = w.galleryImages[j];
        if (imgUrl) {
          const oldPublicId = getPublicIdFromUrl(imgUrl);
          if (oldPublicId) {
            const filename = path.basename(oldPublicId);
            const isAlreadyRenamed = oldPublicId.startsWith(`${folderPath}/`);
            const newPublicId = isAlreadyRenamed ? oldPublicId : `${folderPath}/${filename}`;
            
            let currentUrl = imgUrl;
            if (oldPublicId !== newPublicId) {
              console.log(`Renaming gallery image [${j+1}]: "${oldPublicId}" -> "${newPublicId}"`);
              try {
                await cloudinary.uploader.rename(oldPublicId, newPublicId, { overwrite: true });
                currentUrl = getNewUrlFromOldUrl(imgUrl, newPublicId);
                updated = true;
              } catch (renameErr) {
                console.error(`❌ Failed to rename gallery image [${j+1}]: ${renameErr.message}`);
              }
            }
            
            // Ensure it's visually moved to the target folder in the Media Library
            console.log(`Setting asset_folder for gallery image [${j+1}]: "${newPublicId}" -> "${folderPath}"`);
            try {
              await cloudinary.api.update(newPublicId, { asset_folder: folderPath });
            } catch (updateErr) {
              console.error(`❌ Failed to update asset_folder for gallery [${j+1}]: ${updateErr.message}`);
            }
            
            newGalleryImages.push(currentUrl);
          } else {
            newGalleryImages.push(imgUrl);
          }
        } else {
          newGalleryImages.push(imgUrl);
        }
      }
      w.galleryImages = newGalleryImages;

      if (updated) {
        await w.save();
        migratedCount++;
        console.log(`✅ Successfully updated database fields for: "${w.title}"`);
      } else {
        console.log(`⏭️ No asset migration needed (already in correct folder path).`);
      }
    }

    console.log(`\n=== MIGRATION SUMMARY ===`);
    console.log(`Total Work Items Checked: ${works.length}`);
    console.log(`Successfully Migrated: ${migratedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
