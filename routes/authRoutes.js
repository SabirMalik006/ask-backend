const express = require('express');
const { 
  authUser, 
  getUserProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
