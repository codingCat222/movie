const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  genre: [{ type: String }],
  releaseYear: { type: Number, required: true },
  duration: { type: Number },
  director: { type: String },
  cast: [{ type: String }],
  language: { type: String, default: 'English' },

  posterImage: { type: String, required: true },
  backdropImage: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },

  videoFiles: {
    '480p': { type: String, default: '' },
    '720p': { type: String, default: '' },
    '1080p': { type: String, default: '' }
  },

  subtitles: [{
    language: String,
    url: String
  }],

  isPremium: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },

  rating: { type: Number, default: 0, min: 0, max: 10 },
  ratingCount: { type: Number, default: 0 },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 }
  }],

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },

  tags: [{ type: String }],
  status: { type: String, enum: ['published', 'draft'], default: 'published' },

  downloadable: { type: Boolean, default: false }
}, { timestamps: true });

movieSchema.index({ title: 'text', description: 'text', genre: 'text' });

movieSchema.methods.calculateRating = function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
  return (sum / this.ratings.length).toFixed(1);
};

module.exports = mongoose.model('Movie', movieSchema);