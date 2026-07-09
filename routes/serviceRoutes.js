const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

const router = express.Router();

// GET all services (public endpoint)
router.get('/', getServices);

// Protected admin routes
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
