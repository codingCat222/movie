const Movie = require('../models/Movie');
const User = require('../models/User');

exports.getMovies = async (req, res) => {
  try {
    const { genre, year, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = { status: 'published' };
    if (genre) query.genre = { $in: [genre] };
    if (year) query.releaseYear = parseInt(year);
    if (search) query.$text = { $search: search };
    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select('-videoFiles -ratings'),
      Movie.countDocuments(query)
    ]);
    res.json({ success: true, movies, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFeatured = async (req, res) => {
  try {
    const featured = await Movie.findOne({ isFeatured: true, status: 'published' }).select('-videoFiles');
    const trending = await Movie.find({ isTrending: true, status: 'published' }).limit(10).select('-videoFiles');
    const latest = await Movie.find({ status: 'published' }).sort('-createdAt').limit(10).select('-videoFiles');
    res.json({ success: true, featured, trending, latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-videoFiles');
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    movie.views += 1;
    await movie.save({ validateBeforeSave: false });
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVideoUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = '480p' } = req.query;
    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

    const isPremium = req.user?.isPremium();
    if (movie.isPremium && !isPremium) {
      return res.status(403).json({ success: false, message: 'Premium subscription required', upgradeRequired: true });
    }

    let allowedQuality = quality;
    if (!isPremium && quality !== '480p') allowedQuality = '480p';

    const videoUrl = movie.videoFiles[allowedQuality] || movie.videoFiles['480p'];
    if (!videoUrl) return res.status(404).json({ success: false, message: 'Video not available' });

    res.json({ success: true, videoUrl, quality: allowedQuality });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rateMovie = async (req, res) => {
  try {
    const { score } = req.body;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

    const existing = movie.ratings.findIndex(r => r.user.toString() === req.user.id);
    if (existing >= 0) movie.ratings[existing].score = score;
    else movie.ratings.push({ user: req.user.id, score });

    movie.ratingCount = movie.ratings.length;
    movie.rating = movie.calculateRating();
    await movie.save();
    res.json({ success: true, rating: movie.rating });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    const user = await User.findById(req.user.id);
    const likedIdx = movie.likes.indexOf(req.user.id);
    const userLikedIdx = user.likedMovies.indexOf(req.params.id);

    if (likedIdx >= 0) {
      movie.likes.splice(likedIdx, 1);
      user.likedMovies.splice(userLikedIdx, 1);
    } else {
      movie.likes.push(req.user.id);
      user.likedMovies.push(req.params.id);
    }
    await Promise.all([movie.save({ validateBeforeSave: false }), user.save({ validateBeforeSave: false })]);
    res.json({ success: true, liked: likedIdx < 0, likesCount: movie.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const user = await User.findById(req.user.id);
    const historyIdx = user.watchHistory.findIndex(h => h.movie.toString() === req.params.id);
    if (historyIdx >= 0) {
      user.watchHistory[historyIdx].progress = progress;
      user.watchHistory[historyIdx].watchedAt = new Date();
    } else {
      user.watchHistory.unshift({ movie: req.params.id, progress });
    }
    if (user.watchHistory.length > 50) user.watchHistory = user.watchHistory.slice(0, 50);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};