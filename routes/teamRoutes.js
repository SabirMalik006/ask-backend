const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  fetchLinkedinPhoto
} = require('../controllers/teamController');

const router = express.Router();

// GET all team members (public endpoint)
router.get('/', getTeamMembers);

// Protected admin routes
router.get('/linkedin-photo', protect, fetchLinkedinPhoto);
router.post('/', protect, upload.fields([{ name: 'photo', maxCount: 1 }]), createTeamMember);
router.put('/:id', protect, upload.fields([{ name: 'photo', maxCount: 1 }]), updateTeamMember);
router.delete('/:id', protect, deleteTeamMember);

module.exports = router;
