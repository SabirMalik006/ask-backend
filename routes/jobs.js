const express = require('express');
const {
  getActiveJobs,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getActiveJobs);
router.get('/all', protect, getAllJobs);
router.get('/:id', getJobById);
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;
