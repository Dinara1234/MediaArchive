// controllers/adminController.js
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Media, User, Category, Tag, Log } = require('../models');

/**
 * Записать действие администратора в журнал
 */
async function writeLog(adminId, action, entity, entityId) {
  try {
    await Log.create({ userId: adminId, action, entity, entityId });
  } catch (err) {
    console.error('writeLog error:', err);
  }
}

// ═══════════════════════════════════════════════════
//  МОДЕРАЦИЯ МЕДИА
// ═══════════════════════════════════════════════════

/**
 * GET /api/admin/media — все медиа (включая скрытые и приватные)
 */
async function listAllMedia(req, res) {
  try {
    const { q } = req.query;

    const where = {};
    if (q) {
      where.title = { [Op.iLike]: `%${q}%` };
    }

    const media = await Media.findAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'login'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(media);
  } catch (err) {
    console.error('listAllMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/admin/media/:id/hide — скрыть
 */
async function hideMedia(req, res) {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return res.status(404).json({ error: 'Медиа не найдено' });

    media.isHidden = true;
    await media.save();

    await writeLog(req.session.user.id, 'hide_media', 'Media', media.id);

    res.json({ message: 'Медиа скрыто', media });
  } catch (err) {
    console.error('hideMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/admin/media/:id/unhide — опубликовать обратно
 */
async function unhideMedia(req, res) {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return res.status(404).json({ error: 'Медиа не найдено' });

    media.isHidden = false;
    await media.save();

    await writeLog(req.session.user.id, 'unhide_media', 'Media', media.id);

    res.json({ message: 'Медиа опубликовано', media });
  } catch (err) {
    console.error('unhideMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * DELETE /api/admin/media/:id — удалить любое медиа
 */
async function adminDeleteMedia(req, res) {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return res.status(404).json({ error: 'Медиа не найдено' });

    const absPath = path.join(__dirname, '..', 'public', media.filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }

    const title = media.title;
    await media.destroy();

    await writeLog(req.session.user.id, 'delete_media', 'Media', req.params.id);

    res.json({ message: `Файл "${title}" удалён` });
  } catch (err) {
    console.error('adminDeleteMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// ═══════════════════════════════════════════════════
//  УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
// ═══════════════════════════════════════════════════

/**
 * GET /api/admin/users — список всех пользователей
 */
async function listUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'login', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/admin/users/:id/deactivate — деактивировать
 */
async function deactivateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Нельзя деактивировать себя' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Нельзя деактивировать администратора' });
    }

    user.isActive = false;
    await user.save();

    await writeLog(req.session.user.id, 'deactivate_user', 'User', user.id);

    res.json({ message: `Пользователь ${user.login} деактивирован` });
  } catch (err) {
    console.error('deactivateUser error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/admin/users/:id/activate — активировать обратно
 */
async function activateUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.isActive = true;
    await user.save();

    await writeLog(req.session.user.id, 'activate_user', 'User', user.id);

    res.json({ message: `Пользователь ${user.login} активирован` });
  } catch (err) {
    console.error('activateUser error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// ═══════════════════════════════════════════════════
//  ЖУРНАЛ ДЕЙСТВИЙ
// ═══════════════════════════════════════════════════

/**
 * GET /api/admin/logs — журнал последних действий
 */
async function listLogs(req, res) {
  try {
    const logs = await Log.findAll({
      include: [
        { model: User, as: 'admin', attributes: ['id', 'login'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(logs);
  } catch (err) {
    console.error('listLogs error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/admin/stats — краткая статистика
 */
async function getStats(req, res) {
  try {
    const [usersTotal, usersActive, mediaTotal, mediaHidden, mediaPublic] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      Media.count(),
      Media.count({ where: { isHidden: true } }),
      Media.count({ where: { isPublic: true, isHidden: false } }),
    ]);

    res.json({ usersTotal, usersActive, mediaTotal, mediaHidden, mediaPublic });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = {
  listAllMedia,
  hideMedia,
  unhideMedia,
  adminDeleteMedia,
  listUsers,
  deactivateUser,
  activateUser,
  listLogs,
  getStats,
};