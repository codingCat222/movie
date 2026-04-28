const express = require('express');
const router = express.Router();
const { getDashboardStats, createMovie, updateMovie, deleteMovie, getUsers, banUser, getTransactions } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, admin);
router.get('/stats', getDashboardStats);
router.post('/movies', upload.fields([
  { name: 'poster', maxCount: 1 }, { name: 'backdrop', maxCount: 1 },
  { name: 'video480', maxCount: 1 }, { name: 'video720', maxCount: 1 }, { name: 'video1080', maxCount: 1 }
]), createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.get('/transactions', getTransactions);

module.exports = router;