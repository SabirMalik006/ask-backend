const path = require('path');
const dotenv = require('dotenv');

// Explicitly load env variables from the local backend directory
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const cloudinary = require('./config/cloudinary');

const checkCloudinary = async () => {
  try {
    console.log('Querying Cloudinary assets under work/ui-ux...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'work/ui-ux',
      max_results: 50
    });
    
    console.log(`Found ${result.resources.length} assets under work/ui-ux.`);
    result.resources.forEach(r => {
      console.log(`- PublicID: ${r.public_id}, URL: ${r.secure_url}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying Cloudinary:', error.message);
    process.exit(1);
  }
};

checkCloudinary();
