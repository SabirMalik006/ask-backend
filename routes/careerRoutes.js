const express = require('express');
const { 
  getCareers, 
  getCareerById, 
  createCareer, 
  updateCareer, 
  deleteCareer 
} = require('../controllers/careerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCareers);
router.get('/:id', getCareerById);
router.post('/', protect, createCareer);
router.put('/:id', protect, updateCareer);
router.delete('/:id', protect, deleteCareer);

module.exports = router;
