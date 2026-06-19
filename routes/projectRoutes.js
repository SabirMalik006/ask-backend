const express = require('express');
const { 
  getProjects, 
  getProjectBySlug, 
  createProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProjects);
router.get('/slug/:slug', getProjectBySlug);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
