import api from './api';

export const paymentService = {
  // ── Payments ──────────────────────────────────────
  initializePayment: ()          => api.post('/payments/initialize'),
  verifyPayment:     (reference) => api.get(`/payments/verify/${reference}`),
  getHistory:        ()          => api.get('/payments/history'),

  // ── Downloads ─────────────────────────────────────

  /**
   * Request a secure download token.
   * @param {string} movieId
   * @param {string} quality  '480p' | '720p' | '1080p'
   */
  requestDownload: (movieId, quality = '720p') =>
    api.post('/downloads/request', { movieId, quality }),

  /**
   * Check whether an existing token is still valid
   * without consuming it.
   */
  checkToken: (token) =>
    api.get(`/downloads/status/${token}`),

  /**
   * Build the URL that streams / downloads the file.
   * Can be opened in a new tab or set as <a href>.
   */
  getDownloadUrl: (token) => `/api/downloads/serve/${token}`,

  /**
   * Current user's download history.
   * @param {object} params  { page, limit }
   */
  getDownloadHistory: (params) =>
    api.get('/downloads/history', { params }),

  // ── Admin ─────────────────────────────────────────
  adminGetAllDownloads: (params) =>
    api.get('/downloads/admin/all', { params }),

  revokeDownload: (id) =>
    api.delete(`/downloads/${id}/revoke`),
};