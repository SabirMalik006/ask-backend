const express = require('express');
const { 
  getFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ 
} = require('../controllers/faqController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getFAQs);
router.post('/', protect, createFAQ);
router.put('/:id', protect, updateFAQ);
router.delete('/:id', protect, deleteFAQ);

module.exports = router;
