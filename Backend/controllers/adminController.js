const Movie = require('../models/Movie');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalMovies, activeSubscribers, totalRevenue] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      User.countDocuments({ 'subscription.plan': 'standard', 'subscription.status': 'active' }),
      Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = await Transaction.aggregate([
      { $match: { status: 'success', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const topMovies = await Movie.find().sort('-views').limit(5).select('title views rating');
    res.json({ success: true, stats: {
      totalUsers, totalMovies, activeSubscribers,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      topMovies
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMovie = async (req, res) => {
  try {
    const { title, description, genre, releaseYear, duration, director, cast, language, isPremium, isFeatured, isTrending, downloadable, tags } = req.body;
    const files = req.files || {};
    const movieData = {
      title, description, releaseYear: parseInt(releaseYear), duration: duration ? parseInt(duration) : undefined,
      director, language, isPremium: isPremium === 'true', isFeatured: isFeatured === 'true',
      isTrending: isTrending === 'true', downloadable: downloadable === 'true',
      genre: Array.isArray(genre) ? genre : (genre ? genre.split(',') : []),
      cast: Array.isArray(cast) ? cast : (cast ? cast.split(',') : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',') : [])
    };
    if (files.poster?.[0]) movieData.posterImage = `/uploads/images/${files.poster[0].filename}`;
    if (files.backdrop?.[0]) movieData.backdropImage = `/uploads/images/${files.backdrop[0].filename}`;
    if (req.body.trailerUrl) movieData.trailerUrl = req.body.trailerUrl;
    movieData.videoFiles = {};
    ['480p', '720p', '1080p'].forEach(q => {
      const key = `video${q.replace('p', '')}`;
      if (files[key]?.[0]) movieData.videoFiles[q] = `/uploads/videos/${files[key][0].filename}`;
    });
    const movie = await Movie.create(movieData);
    res.status(201).json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).select('-password').sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { 'subscription.status': 'cancelled' }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name email').sort('-createdAt').limit(50);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};