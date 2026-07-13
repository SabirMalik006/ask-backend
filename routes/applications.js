const express = require('express');
const multer = require('multer');
const {
  submitApplication,
  getApplications,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure memory storage and file filter for resume uploads
const storage = multer.memoryStorage();
const uploadResume = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and image (JPEG/PNG/WEBP) files are allowed for resumes!'), false);
    }
  }
});

router.post('/', uploadResume.single('resume'), submitApplication);
router.get('/', protect, getApplications);
router.put('/:id/status', protect, updateApplicationStatus);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
