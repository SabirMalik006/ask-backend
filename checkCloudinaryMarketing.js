const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const cloudinary = require('./config/cloudinary');

const check = async () => {
  try {
    console.log('Listing folders in Cloudinary under "work"...');
    const workSubs = await cloudinary.api.sub_folders('work');
    console.log('Subfolders of "work":', workSubs.folders.map(f => f.path));

    console.log('\nChecking "work/digital-marketing" folder...');
    try {
      const marketingSubs = await cloudinary.api.sub_folders('work/digital-marketing');
      console.log('Subfolders of "work/digital-marketing":', marketingSubs.folders.map(f => f.path));
    } catch (e) {
      console.log('No folders exist or folder "work/digital-marketing" not found:', e.message);
    }

    console.log('\nChecking for any resources in "work/digital-marketing" (recursive)...');
    try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'work/digital-marketing',
        max_results: 50
      });
      console.log(`Found ${resources.resources.length} resources:`);
      resources.resources.forEach(r => {
        console.log(`- public_id: "${r.public_id}" | url: "${r.secure_url}"`);
      });
    } catch (e) {
      console.log('Error listing resources:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
