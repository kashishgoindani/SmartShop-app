const express = require('express');
const router = express.Router();
const { addUdhaar, getUdhaar, makePayment, getOverdue } = require('../controllers/udhaarController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/', auth, addUdhaar);
router.get('/', auth, getUdhaar);
router.put('/:id/payment', auth, makePayment);
router.get('/overdue', auth, adminOnly, getOverdue);

module.exports = router;