// routes/users.js
const express = require('express');
const router = express.Router();
const { getWatchlist, toggleWatchlist, getWatchHistory, getSubscriptionStatus } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
router.get('/watchlist', protect, getWatchlist);
router.post('/watchlist/:movieId', protect, toggleWatchlist);
router.get('/history', protect, getWatchHistory);
router.get('/subscription', protect, getSubscriptionStatus);
module.exports = router;