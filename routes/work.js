const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  addGalleryImages,
  deleteGalleryImage
} = require('../controllers/workController');

const router = express.Router();

// Public routes
router.get('/', getWorks);
router.get('/:id', getWorkById);

// Protected admin routes
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ]),
  createWork
);

router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ]),
  updateWork
);

router.delete('/:id', protect, deleteWork);

// Gallery operations
router.post(
  '/:id/images',
  protect,
  upload.fields([
    { name: 'galleryImages', maxCount: 10 }
  ]),
  addGalleryImages
);

router.delete('/:id/images/:imageId', protect, deleteGalleryImage);

module.exports = router;
