const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const cloudinary = require('./config/cloudinary');

const checkCloudinary = async () => {
  try {
    console.log('Querying Cloudinary assets under work/video-editing...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'work/video-editing',
      max_results: 50
    });
    
    console.log(`Found ${result.resources.length} assets under work/video-editing.`);
    result.resources.forEach(r => {
      console.log(`- PublicID: ${r.public_id}, URL: ${r.secure_url}`);
    });
    
    // Also check for videos (resource_type: video)
    const videoResult = await cloudinary.api.resources({
      resource_type: 'video',
      prefix: 'work/video-editing',
      max_results: 50
    });
    console.log(`Found ${videoResult.resources.length} video assets under work/video-editing.`);
    videoResult.resources.forEach(r => {
      console.log(`- PublicID: ${r.public_id}, URL: ${r.secure_url}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying Cloudinary:', error.message);
    process.exit(1);
  }
};

checkCloudinary();
