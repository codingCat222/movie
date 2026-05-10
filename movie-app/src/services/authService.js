import api from './api';

export const authService = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getMe: () => api.get('/me'),
  updateProfile: (data) => api.put('/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/change-password', data),
};