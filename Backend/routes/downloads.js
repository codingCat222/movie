const mongoose = require('mongoose');
const crypto = require('crypto');

const downloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  quality: {
    type: String,
    enum: ['480p', '720p', '1080p'],
    default: '720p'
  },

  // Secure token — single-use, 64 hex chars
  token: {
    type: String,
    unique: true,
    index: true
  },

  // Expiry
  expiresAt: {
    type: Date,
    required: true
  },

  // State
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },

  // Request metadata
  ipAddress:  { type: String, default: '' },
  userAgent:  { type: String, default: '' },

  // Admin can revoke a link before it is used
  revoked:    { type: Boolean, default: false },
  revokedAt:  Date,
  revokedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Bytes served (for partial-range / streaming downloads)
  bytesServed: { type: Number, default: 0 }

}, { timestamps: true });

// Auto-generate token before first save
downloadSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Virtual: is the link still valid?
downloadSchema.virtual('isValid').get(function () {
  if (this.used)                   return false;
  if (this.revoked)                return false;
  if (new Date() > this.expiresAt) return false;
  return true;
});

// Virtual: human-readable status
downloadSchema.virtual('linkStatus').get(function () {
  if (this.revoked)                return 'revoked';
  if (new Date() > this.expiresAt) return 'expired';
  if (this.used)                   return 'used';
  return 'active';
});

downloadSchema.set('toJSON',   { virtuals: true });
downloadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Download', downloadSchema);