const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getApprovedReviews,
  getAllReviews,
  submitReview,
  createReviewAdmin,
  updateReviewStatus,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

const router = express.Router();

// GET /api/reviews -> Public, list only Approved reviews
router.get('/', getApprovedReviews);

// GET /api/reviews/all -> Admin only, list all reviews (supports ?status=Pending)
router.get('/all', protect, getAllReviews);

// POST /api/reviews -> Public submission, forces 'Public Submission' & 'Pending'
router.post('/', upload.single('photo'), submitReview);

// POST /api/reviews/admin -> Admin only, create review directly
router.post('/admin', protect, upload.single('photo'), createReviewAdmin);

// PUT /api/reviews/:id/status -> Admin only, approve/reject review
router.put('/:id/status', protect, updateReviewStatus);

// PUT /api/reviews/:id -> Admin only, edit review content
router.put('/:id', protect, upload.single('photo'), updateReview);

// DELETE /api/reviews/:id -> Admin only, delete review
router.delete('/:id', protect, deleteReview);

module.exports = router;
