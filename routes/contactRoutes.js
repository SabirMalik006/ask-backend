const express = require('express');
const { createContact, getContacts, updateContactStatus } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', createContact);
router.get('/', protect, getContacts);
router.put('/:id/status', protect, updateContactStatus);

module.exports = router;
