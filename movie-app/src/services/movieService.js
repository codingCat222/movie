import api from './api';

export const movieService = {
  getMovies: (params) => api.get('/movies', { params }),
  getFeatured: () => api.get('/movies/featured'),
  getMovie: (id) => api.get(`/movies/${id}`),
  getVideoUrl: (id, quality) => api.get(`/movies/${id}/video`, { params: { quality } }),
  rateMovie: (id, score) => api.post(`/movies/${id}/rate`, { score }),
  toggleLike: (id) => api.post(`/movies/${id}/like`),
  saveProgress: (id, progress) => api.post(`/movies/${id}/progress`, { progress }),
};

export const userService = {
  getWatchlist: () => api.get('/users/watchlist'),
  toggleWatchlist: (movieId) => api.post(`/users/watchlist/${movieId}`),
  getWatchHistory: () => api.get('/users/history'),
  getSubscription: () => api.get('/users/subscription'),
};