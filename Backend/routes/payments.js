const express = require('express');
const router = express.Router();
const { initializePayment, verifyPayment, webhook, getTransactionHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/webhook', webhook);
router.post('/initialize', protect, initializePayment);
router.get('/verify/:reference', protect, verifyPayment);
router.get('/history', protect, getTransactionHistory);

module.exports = router;