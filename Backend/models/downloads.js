const express = require('express');
const router  = express.Router();

const {
  requestDownload,
  serveDownload,
  getDownloadHistory,
  checkToken,
  revokeDownload,
  adminGetAll
} = require('../controllers/downloadController');

const { protect, admin } = require('../middleware/auth');

/* ─────────────────────────────────────────────────────────
   USER ROUTES  (require login)
───────────────────────────────────────────────────────── */

/**
 * POST /api/downloads/request
 * Request a secure download token for a movie.
 * Body: { movieId: string, quality: '480p'|'720p'|'1080p' }
 * Requires: logged in + active Standard subscription
 * Returns: { token, downloadUrl, expiresAt, downloadsRemaining, ... }
 */
router.post('/request', protect, requestDownload);

/**
 * GET /api/downloads/history
 * Fetch the current user's full download history.
 * Query: ?page=1&limit=20
 * Returns: { downloads[], total, pages }
 */
router.get('/history', protect, getDownloadHistory);

/* ─────────────────────────────────────────────────────────
   PUBLIC TOKEN ROUTES  (no login — token IS the credential)
───────────────────────────────────────────────────────── */

/**
 * GET /api/downloads/status/:token
 * Check whether a download token is still valid without consuming it.
 * Used by the frontend to decide whether to show "Download" or "Request new link".
 * Returns: { valid, status, quality, movieTitle, expiresAt }
 */
router.get('/status/:token', checkToken);

/**
 * GET /api/downloads/serve/:token
 * Stream / download the video file.
 * Supports HTTP Range requests (partial content 206) for seeking & resuming.
 * Marks the token as used after the full file is served.
 * Token is single-use and time-limited (default 48h).
 */
router.get('/serve/:token', serveDownload);

/* ─────────────────────────────────────────────────────────
   ADMIN ROUTES  (require login + admin role)
───────────────────────────────────────────────────────── */

/**
 * GET /api/downloads/admin/all
 * List all download records with filters and stats.
 * Query: ?page=1&limit=30&status=active|used|expired|revoked&userId=x&movieId=y
 * Returns: { downloads[], total, pages, stats }
 */
router.get('/admin/all', protect, admin, adminGetAll);

/**
 * DELETE /api/downloads/:id/revoke
 * Revoke an active download link before it is used.
 * Useful for abuse prevention or accidental token exposure.
 */
router.delete('/:id/revoke', protect, admin, revokeDownload);

module.exports = router;