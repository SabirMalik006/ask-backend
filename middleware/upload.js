const multer = require('multer');

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
    }
  }
});

module.exports = upload;
