const mongoose = require('mongoose');
const Work = require('./models/Work');
const dotenv = require('dotenv');
const path = require('path');

delete process.env.MONGO_URI;
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const cloudinary = require('./config/cloudinary');

const initialWorks = [
  {
    title: "ASK Corporate Portal Development",
    category: "Web Development",
    client: "Umair Bangash",
    services: "Web development & optimization",
    industries: "Technology",
    tags: ["WordPress Development", "Custom Web Application", "PHP", "MySQL"],
    viewMoreLabel: "Umair Bangash",
    viewMoreUrl: "https://umairbangash.com",
    description: "A comprehensive custom web portal developed for corporate service representation.",
    heroImage: "https://mixdesign.dev/themeforest/rayo/img/works/preview/600x730_prv-02.webp",
    galleryImages: [
      "https://mixdesign.dev/themeforest/rayo/img/works/preview/600x730_prv-01.webp",
      "https://mixdesign.dev/themeforest/rayo/img/works/preview/600x730_prv-03.webp"
    ],
    order: 1
  },
  {
    title: "ASK Logistics Tracker App",
    category: "App Development",
    client: "LogiTrans Inc.",
    services: "Hybrid mobile app design & development",
    industries: "Logistics & Cargo",
    tags: ["React Native", "Android", "iOS", "Mapbox Integration"],
    viewMoreLabel: "Live Store",
    viewMoreUrl: "https://play.google.com",
    description: "High-performance hybrid mobile tracker app allowing real-time package status mapping.",
    heroImage: "https://img.freepik.com/premium-vector/digital-presentation-screen-icon-concept-isolated-white-background_1287274-99165.jpg?semt=ais_rp_50_assets&w=740&q=80",
    galleryImages: [
      "https://mixdesign.dev/themeforest/rayo/img/works/preview/600x730_prv-04.webp"
    ],
    order: 2
  },
  {
    title: "Fintech Dashboard Redesign UX",
    category: "UI/UX",
    client: "PaySimple",
    services: "Interface design & wireframing",
    industries: "Finance",
    tags: ["Figma", "User Journey", "Wireframing"],
    viewMoreLabel: "Interactive Prototype",
    viewMoreUrl: "https://figma.com",
    description: "User experience exploration and interface layout optimization for fintech transaction panels.",
    heroImage: "https://mixdesign.dev/themeforest/rayo/img/works/preview/600x730_prv-05.webp",
    galleryImages: [],
    order: 3
  }
];

const seedWorks = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from env file');
    }
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Clearing existing works...');
    await Work.deleteMany({});
    
    console.log('Uploading images to Cloudinary and seeding database...');
    for (const w of initialWorks) {
      console.log(`Uploading hero image for: ${w.title}...`);
      
      let heroUrl = "";
      try {
        const uploadHero = await cloudinary.uploader.upload(w.heroImage, {
          folder: 'work_portfolio'
        });
        heroUrl = uploadHero.secure_url;
        console.log(`Successfully uploaded hero image. URL: ${heroUrl}`);
      } catch (uploadError) {
        console.error(`Failed to upload hero image for ${w.title}:`, uploadError);
        heroUrl = w.heroImage; // fallback to static url
      }

      const galleryUrls = [];
      for (const imgUrl of w.galleryImages) {
        console.log(`Uploading gallery image (${imgUrl}) for: ${w.title}...`);
        try {
          const uploadGallery = await cloudinary.uploader.upload(imgUrl, {
            folder: 'work_portfolio'
          });
          galleryUrls.push(uploadGallery.secure_url);
        } catch (uploadError) {
          console.error(`Failed to upload gallery image for ${w.title}:`, uploadError);
          galleryUrls.push(imgUrl); // fallback to static url
        }
      }

      await Work.create({
        ...w,
        heroImage: heroUrl,
        galleryImages: galleryUrls
      });
      
      console.log(`Saved work item: ${w.title} into database.`);
    }
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding works:', error);
    process.exit(1);
  }
};

seedWorks();
