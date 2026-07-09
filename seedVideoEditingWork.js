const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Explicitly load env variables from local backend directory
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const Work = require('./models/Work');
const cloudinary = require('./config/cloudinary');

const getCleanPublicId = (filename) => {
  const nameWithoutExt = path.parse(filename).name;
  return nameWithoutExt
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/_$/g, '');
};

const getVideoPosterUrl = (videoUrl) => {
  if (!videoUrl) return '';
  // Change file extension to .jpg
  let posterUrl = videoUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg');
  // Inject so_auto transformation right after /video/upload/
  if (posterUrl.includes('/video/upload/')) {
    posterUrl = posterUrl.replace('/video/upload/', '/video/upload/so_auto/');
  }
  return posterUrl;
};

// Exact original list of 58 videos from video-project-details.html in order
const rawVideoFilenames = [
  'video 1.mp4',
  'video 2.mp4',
  'video 3.mp4',
  'video 4.mp4',
  'video 5.mp4',
  'video 18.mp4',
  'video 30.mp4',
  'video 8.mp4',
  'video 36.MP4',
  'video 37.MP4',
  'video 38.MP4',
  'video 39.MP4',
  'video 40.MOV',
  'video 41.MP4',
  'video 9.mp4',
  'video 10.mp4',
  'video 26.mp4',
  'video 28.mp4',
  'video 27.mp4',
  'video 31.mp4',
  'video 33.mp4',
  'video 32.mp4',
  'video 17.mp4',
  'video 15.mp4',
  'video 19.mp4',
  'video 20.mp4',
  'video 21.mp4',
  'video 22.mp4',
  'video 23.mp4',
  'video 24.mp4',
  'video 25.mp4',
  'video 11.mp4',
  'video 13.mp4',
  'video 12.mp4',
  'video 6.mp4',
  'video 7.mp4',
  'video 16.mp4',
  'video 29.mp4',
  'video 34 (1).mp4',
  'video 34 (2).mp4',
  'video 35 (1).mp4',
  'video 34 (4).mp4',
  'video 34 (5).mp4',
  'video 34 (6).mp4',
  'video 34 (7).mp4',
  'video 34 (8).mp4',
  'video 34 (9).mp4',
  'video 34 (10).mp4',
  'video 34 (11).mp4',
  'video 34 (12).mp4',
  'video 34 (13).mp4', // Will resolve correctly locally
  'video 34 (14).mp4',
  'video 35 (2).mp4',
  'video 35 (3).mp4',
  'video 35 (4).mp4',
  'video 35 (5).mp4',
  'video 35 (6).mp4',
  'video 35 (7).mp4'
];

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from env file');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database successfully.\n');

    const folderPath = 'work/video-editing';
    
    // Explicitly create Cloudinary folder
    await cloudinary.api.create_folder(folderPath).catch(() => {});

    // Fetch existing video resources in Cloudinary to support idempotency/skipping uploads
    console.log('Querying existing video resources from Cloudinary folder...');
    const existingVideosMap = new Map();
    try {
      let nextCursor = null;
      do {
        const res = await cloudinary.api.resources({
          resource_type: 'video',
          prefix: folderPath,
          max_results: 100,
          next_cursor: nextCursor
        });
        
        if (res.resources) {
          for (const item of res.resources) {
            existingVideosMap.set(item.public_id, item.secure_url);
          }
        }
        nextCursor = res.next_cursor;
      } while (nextCursor);
      console.log(`Found ${existingVideosMap.size} existing videos cached in Cloudinary.\n`);
    } catch (e) {
      console.log('No video folder or failed query, starting fresh Cloudinary queue.', e.message);
    }

    // Upload custom poster image for video 3
    let video3PosterUrl = '';
    const localPosterPath = path.resolve(__dirname, '../new-ask-frontend/img/poster 1.jpeg');
    if (fs.existsSync(localPosterPath)) {
      console.log('Uploading custom poster 1.jpeg to Cloudinary...');
      try {
        const posterRes = await cloudinary.uploader.upload(localPosterPath, {
          folder: folderPath,
          public_id: 'poster_1',
          resource_type: 'image'
        });
        video3PosterUrl = posterRes.secure_url;
        console.log(`Poster uploaded: ${video3PosterUrl}`);
      } catch (err) {
        console.error('Failed to upload custom poster:', err.message);
      }
    } else {
      console.warn('⚠️ Custom poster image not found locally at:', localPosterPath);
    }

    const mediaList = [];
    const localVideoDir = path.resolve(__dirname, '../new-ask-frontend/videos');

    for (let i = 0; i < rawVideoFilenames.length; i++) {
      const filename = rawVideoFilenames[i];
      // Handle case-sensitivity for video 34 (13).mp4 locally (it is named video 34 (13).MP4 on disk)
      let resolvedFilename = filename;
      if (filename === 'video 34 (13).mp4') {
        const testUpper = 'video 34 (13).MP4';
        if (fs.existsSync(path.join(localVideoDir, testUpper))) {
          resolvedFilename = testUpper;
        }
      }

      const localPath = path.join(localVideoDir, resolvedFilename);
      const cleanId = getCleanPublicId(filename);
      const fullPublicId = `${folderPath}/${cleanId}`;

      let cloudinaryVideoUrl = '';

      if (existingVideosMap.has(fullPublicId)) {
        cloudinaryVideoUrl = existingVideosMap.get(fullPublicId);
        console.log(`[${i + 1}/58] ⏭️ Reusing existing Cloudinary video: "${filename}"`);
      } else {
        if (!fs.existsSync(localPath)) {
          console.warn(`[${i + 1}/58] ❌ Local video file not found: ${localPath}`);
          continue;
        }

        console.log(`[${i + 1}/58] 📤 Uploading "${resolvedFilename}"...`);
        try {
          const uploadRes = await cloudinary.uploader.upload(localPath, {
            folder: folderPath,
            public_id: cleanId,
            resource_type: 'video'
          });
          cloudinaryVideoUrl = uploadRes.secure_url;
          console.log(`[${i + 1}/58] ✅ Uploaded: ${cloudinaryVideoUrl}`);
        } catch (err) {
          console.error(`[${i + 1}/58] ❌ Failed to upload "${resolvedFilename}":`, err.message);
          continue;
        }
      }

      // Poster generation
      let posterUrl = '';
      if (filename === 'video 3.mp4' && video3PosterUrl) {
        posterUrl = video3PosterUrl;
      } else {
        posterUrl = getVideoPosterUrl(cloudinaryVideoUrl);
      }

      mediaList.push({
        type: 'video',
        url: cloudinaryVideoUrl,
        poster: posterUrl
      });
    }

    console.log(`\nAll assets processed. Successfully created ${mediaList.length} media entries.`);

    // 5. Seed or Update Work document
    const categoryName = 'Video Editing';
    const projectTitle = 'Video Editing Portfolio';
    const workData = {
      title: projectTitle,
      category: categoryName,
      client: 'ASK Showcase',
      services: 'Video Editing',
      platforms: 'CapCut, Filmora, Adobe Premiere Pro, Canva',
      specialization: 'Branding & Social Media Content',
      serviceList: ['Short-Form Editing', 'Long-Form Editing', 'Reels / Shorts', 'Ads Editing'],
      tags: ['CapCut', 'Filmora', 'Adobe Premiere Pro', 'Canva'],
      description: 'Professional video editing solutions designed to create engaging, high-quality content for brands, businesses, and creators across social media platforms.',
      media: mediaList,
      order: 0
    };

    const existingWork = await Work.findOne({ category: categoryName, title: projectTitle });
    if (existingWork) {
      console.log(`Updating existing Work record for ${categoryName}...`);
      await Work.updateOne({ _id: existingWork._id }, workData);
      console.log(`✅ Work record updated successfully (ID: ${existingWork._id}).`);
    } else {
      console.log(`Creating new Work record for ${categoryName}...`);
      const newWork = await Work.create(workData);
      console.log(`✅ Work record created successfully (ID: ${newWork._id}).`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
