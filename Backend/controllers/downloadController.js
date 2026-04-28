const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const Movie    = require('../models/Movie');
const User     = require('../models/User');
const Download = require('../models/Download');

/* ─────────────────────────────────────────
   Helper – get real client IP
───────────────────────────────────────── */
const getIP = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  || req.socket?.remoteAddress
  || '';

/* ─────────────────────────────────────────
   POST /api/downloads/request
   Body: { movieId, quality }
   Auth: protect (must be logged in + premium)
───────────────────────────────────────── */
exports.requestDownload = async (req, res) => {
  try {
    const { movieId, quality = '720p' } = req.body;

    // ── 1. Validate inputs ──────────────────
    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }
    if (!['480p', '720p', '1080p'].includes(quality)) {
      return res.status(400).json({ success: false, message: 'Invalid quality. Use 480p, 720p or 1080p' });
    }

    // ── 2. Subscription check ───────────────
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: 'Standard subscription required to download movies',
        upgradeRequired: true
      });
    }

    // ── 3. Monthly download counter reset ───
    const now = new Date();
    const resetDate = user.downloadResetDate || now;
    const monthChanged =
      now.getMonth()    !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear();

    if (monthChanged) {
      user.downloadCount    = 0;
      user.downloadResetDate = now;
    }

    const maxDownloads = parseInt(process.env.MAX_DOWNLOADS_PER_MONTH) || 5;
    if (user.downloadCount >= maxDownloads) {
      return res.status(403).json({
        success: false,
        message: `You have reached your monthly download limit (${maxDownloads}). Resets on the 1st of next month.`,
        limitReached: true,
        downloadsUsed: user.downloadCount,
        maxDownloads
      });
    }

    // ── 4. Movie checks ─────────────────────
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    if (movie.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Movie is not available' });
    }
    if (!movie.downloadable) {
      return res.status(400).json({
        success: false,
        message: 'This movie is not available for download'
      });
    }

    // ── 5. Video file exists? ────────────────
    const videoRelPath = movie.videoFiles[quality] || movie.videoFiles['720p'] || movie.videoFiles['480p'];
    if (!videoRelPath) {
      return res.status(404).json({
        success: false,
        message: `No ${quality} video file found for this movie`
      });
    }
    const resolvedQuality = Object.keys(movie.videoFiles).find(q => movie.videoFiles[q] === videoRelPath) || quality;

    // ── 6. Prevent duplicate active tokens ──
    const existing = await Download.findOne({
      user: user._id,
      movie: movieId,
      quality: resolvedQuality,
      used: false,
      revoked: false,
      expiresAt: { $gt: now }
    });
    if (existing) {
      return res.json({
        success: true,
        token: existing.token,
        expiresAt: existing.expiresAt,
        downloadsRemaining: maxDownloads - user.downloadCount,
        reused: true,
        message: 'An active download link already exists for this movie'
      });
    }

    // ── 7. Create token & record ─────────────
    const expiryHours = parseInt(process.env.DOWNLOAD_EXPIRY_HOURS) || 48;
    const expiresAt   = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    const download = await Download.create({
      user:      user._id,
      movie:     movieId,
      quality:   resolvedQuality,
      expiresAt,
      ipAddress: getIP(req),
      userAgent: req.headers['user-agent'] || ''
    });

    // ── 8. Increment counter ─────────────────
    user.downloadCount += 1;
    await user.save({ validateBeforeSave: false });

    // ── 9. Respond ───────────────────────────
    return res.status(201).json({
      success: true,
      token:              download.token,
      expiresAt:          download.expiresAt,
      quality:            resolvedQuality,
      movieTitle:         movie.title,
      downloadsUsed:      user.downloadCount,
      downloadsRemaining: maxDownloads - user.downloadCount,
      maxDownloads,
      downloadUrl:        `/api/downloads/serve/${download.token}`,
      expiresInHours:     expiryHours
    });

  } catch (err) {
    console.error('[downloadController.requestDownload]', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/downloads/serve/:token
   No auth required — token IS the credential.
   Supports HTTP Range requests for video streaming.
───────────────────────────────────────── */
exports.serveDownload = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 32) {
      return res.status(400).json({ success: false, message: 'Invalid download token' });
    }

    // ── 1. Fetch & validate link ─────────────
    const download = await Download
      .findOne({ token })
      .populate('movie', 'title videoFiles');

    if (!download) {
      return res.status(404).json({ success: false, message: 'Download link not found or invalid' });
    }
    if (download.revoked) {
      return res.status(403).json({ success: false, message: 'This download link has been revoked' });
    }
    if (download.used) {
      return res.status(410).json({
        success: false,
        message: 'This download link has already been used. Request a new one.',
        usedAt: download.usedAt
      });
    }
    if (new Date() > download.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'This download link has expired. Please request a new one.',
        expiredAt: download.expiresAt
      });
    }

    // ── 2. Resolve file path ─────────────────
    const movie = download.movie;
    const videoRelPath =
      movie.videoFiles[download.quality] ||
      movie.videoFiles['720p']            ||
      movie.videoFiles['480p'];

    if (!videoRelPath) {
      return res.status(404).json({ success: false, message: 'Video file not configured' });
    }

    const filePath = path.resolve(__dirname, '..', videoRelPath.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server. Contact support.'
      });
    }

    // ── 3. File metadata ─────────────────────
    const stat     = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext      = path.extname(filePath).toLowerCase();
    const mimeMap  = {
      '.mp4':  'video/mp4',
      '.mkv':  'video/x-matroska',
      '.webm': 'video/webm',
      '.avi':  'video/x-msvideo',
      '.mov':  'video/quicktime'
    };
    const mimeType    = mimeMap[ext] || 'video/mp4';
    const safeTitle   = movie.title.replace(/[^a-z0-9 _\-]/gi, '').trim().replace(/\s+/g, '_');
    const disposition = `attachment; filename="${safeTitle}_${download.quality}${ext}"`;

    // ── 4. HTTP Range support (partial content) ──
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      // Parse "bytes=start-end"
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.status(206).set({
        'Content-Range':       `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':       'bytes',
        'Content-Length':      chunkSize,
        'Content-Type':        mimeType,
        'Content-Disposition': disposition,
        'Cache-Control':       'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      // Update bytes served (non-blocking)
      Download.findByIdAndUpdate(download._id, { $inc: { bytesServed: chunkSize } }).exec();

      fileStream.pipe(res);

      // Only mark as used when the final chunk is requested
      if (end === fileSize - 1) {
        fileStream.on('close', async () => {
          try {
            download.used   = true;
            download.usedAt = new Date();
            await download.save();
          } catch { /* non-critical */ }
        });
      }

    } else {
      // ── 5. Full file download ────────────────
      res.status(200).set({
        'Content-Length':      fileSize,
        'Content-Type':        mimeType,
        'Content-Disposition': disposition,
        'Accept-Ranges':       'bytes',
        'Cache-Control':       'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('close', async () => {
        try {
          download.used        = true;
          download.usedAt      = new Date();
          download.bytesServed = fileSize;
          await download.save();
        } catch { /* non-critical */ }
      });

      fileStream.on('error', (streamErr) => {
        console.error('[serveDownload] stream error:', streamErr.message);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file' });
        }
      });
    }

  } catch (err) {
    console.error('[downloadController.serveDownload]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
  }
};

/* ─────────────────────────────────────────
   GET /api/downloads/history
   Auth: protect
   Returns current user's download history
───────────────────────────────────────── */
exports.getDownloadHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [downloads, total] = await Promise.all([
      Download
        .find({ user: req.user.id })
        .populate('movie', 'title posterImage genre releaseYear')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true }),
      Download.countDocuments({ user: req.user.id })
    ]);

    // Attach download URL only for active links
    const enriched = downloads.map(d => ({
      ...d,
      downloadUrl: d.linkStatus === 'active' ? `/api/downloads/serve/${d.token}` : null
    }));

    res.json({
      success: true,
      downloads: enriched,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/downloads/status/:token
   Public — check if a token is still valid
   (used by frontend before showing download btn)
───────────────────────────────────────── */
exports.checkToken = async (req, res) => {
  try {
    const download = await Download
      .findOne({ token: req.params.token })
      .populate('movie', 'title')
      .lean({ virtuals: true });

    if (!download) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    res.json({
      success: true,
      status:     download.linkStatus,
      valid:      download.isValid,
      quality:    download.quality,
      movieTitle: download.movie?.title,
      expiresAt:  download.expiresAt,
      usedAt:     download.usedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE /api/downloads/:id/revoke
   Auth: protect + admin
   Revoke an active download link
───────────────────────────────────────── */
exports.revokeDownload = async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);
    if (!download) {
      return res.status(404).json({ success: false, message: 'Download record not found' });
    }
    if (download.used || download.revoked) {
      return res.status(400).json({ success: false, message: 'Link already used or revoked' });
    }

    download.revoked   = true;
    download.revokedAt = new Date();
    download.revokedBy = req.user.id;
    await download.save();

    res.json({ success: true, message: 'Download link revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/downloads/admin/all
   Auth: protect + admin
   All downloads with pagination + filters
───────────────────────────────────────── */
exports.adminGetAll = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 30,
      status,          // 'active' | 'used' | 'expired' | 'revoked'
      userId,
      movieId
    } = req.query;

    const query = {};
    if (userId)  query.user  = userId;
    if (movieId) query.movie = movieId;

    // Status filters
    const now = new Date();
    if (status === 'active')  { query.used = false; query.revoked = false; query.expiresAt = { $gt: now }; }
    if (status === 'used')    { query.used = true; }
    if (status === 'revoked') { query.revoked = true; }
    if (status === 'expired') { query.used = false; query.revoked = false; query.expiresAt = { $lte: now }; }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [downloads, total] = await Promise.all([
      Download
        .find(query)
        .populate('user',  'name email')
        .populate('movie', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true }),
      Download.countDocuments(query)
    ]);

    // Summary stats
    const [activeCount, usedCount, revokedCount] = await Promise.all([
      Download.countDocuments({ used: false, revoked: false, expiresAt: { $gt: now } }),
      Download.countDocuments({ used: true }),
      Download.countDocuments({ revoked: true })
    ]);

    res.json({
      success: true,
      downloads,
      total,
      pages: Math.ceil(total / limit),
      stats: { active: activeCount, used: usedCount, revoked: revokedCount }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};