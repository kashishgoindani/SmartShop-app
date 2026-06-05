const express = require('express');
const router = express.Router();
const { addStaff, getStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, getStaff);
router.post('/', auth, adminOnly, addStaff);
router.put('/:id', auth, adminOnly, updateStaff);
router.delete('/:id', auth, adminOnly, deleteStaff);

module.exports = router;