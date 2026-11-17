// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

// Все маршруты ниже — только для админа
router.use(requireRole('admin'));

// Статистика
router.get('/stats', adminController.getStats);

// Модерация медиа
router.get('/media', adminController.listAllMedia);
router.put('/media/:id/hide', adminController.hideMedia);
router.put('/media/:id/unhide', adminController.unhideMedia);
router.delete('/media/:id', adminController.adminDeleteMedia);

// Пользователи
router.get('/users', adminController.listUsers);
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.put('/users/:id/activate', adminController.activateUser);

// Журнал
router.get('/logs', adminController.listLogs);

module.exports = router;