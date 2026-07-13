const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getCachedGoogleReviews, 
  refreshGoogleReviews 
} = require('../controllers/googleReviewController');

const router = express.Router();

// GET /api/google-reviews -> Public, returns cached Google reviews
router.get('/', getCachedGoogleReviews);

// POST /api/google-reviews/refresh -> Admin only, manually refresh cache on demand
router.post('/refresh', protect, refreshGoogleReviews);

module.exports = router;
