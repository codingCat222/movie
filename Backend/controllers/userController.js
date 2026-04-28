const User = require('../models/User');

exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('watchlist', 'title posterImage genre releaseYear rating isPremium');
    res.json({ success: true, watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const movieId = req.params.movieId;
    const idx = user.watchlist.indexOf(movieId);
    if (idx >= 0) user.watchlist.splice(idx, 1);
    else user.watchlist.push(movieId);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, inWatchlist: idx < 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('watchHistory.movie', 'title posterImage genre duration');
    res.json({ success: true, history: user.watchHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription');
    res.json({ success: true, subscription: user.subscription, isPremium: req.user.isPremium() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};