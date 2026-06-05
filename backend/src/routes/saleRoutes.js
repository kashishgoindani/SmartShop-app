const express = require('express');
const router = express.Router();
const { createSale, getSales, getDailyReport } = require('../controllers/saleController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/', auth, createSale);
router.get('/', auth, getSales);
router.get('/daily-report', auth, adminOnly, getDailyReport);

module.exports = router;