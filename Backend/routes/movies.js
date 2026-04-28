const express = require('express');
const router = express.Router();
const { getMovies, getFeatured, getMovie, getVideoUrl, rateMovie, toggleLike, saveProgress } = require('../controllers/movieController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getMovies);
router.get('/featured', optionalAuth, getFeatured);
router.get('/:id', optionalAuth, getMovie);
router.get('/:id/video', protect, getVideoUrl);
router.post('/:id/rate', protect, rateMovie);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/progress', protect, saveProgress);

module.exports = router;