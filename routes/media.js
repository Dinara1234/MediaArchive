// routes/media.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const mediaController = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');

// ─── Публичные маршруты ───────────────────────────
// Лента
router.get('/', mediaController.listMedia);

// ⚠️ /my ДОЛЖЕН идти ДО /:id, иначе Express посчитает "my" как id
router.get('/my', requireAuth, mediaController.listMyMedia);

// Одна карточка
router.get('/:id', mediaController.getMediaById);

// Скачивание
router.get('/:id/download', mediaController.downloadMedia);

// ─── Защищённые маршруты ──────────────────────────
// Загрузка
router.post(
  '/',
  requireAuth,
  upload.array('files', 20),
  mediaController.uploadMedia
);

// Удаление
router.delete('/:id', requireAuth, mediaController.deleteMedia);

module.exports = router;