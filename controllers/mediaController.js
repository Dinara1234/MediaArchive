// controllers/mediaController.js
const path = require('path');
const { Op } = require('sequelize');
const { Media, Tag, User, Category } = require('../models');

/**
 * Исправляет кодировку имени файла.
 * Multer читает originalname как Latin-1, хотя браузер отправляет UTF-8.
 * Преобразуем байты обратно: Latin-1 → Buffer → UTF-8.
 */
function decodeFilename(name) {
  if (!name) return name;
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch (err) {
    return name;   // если что-то пошло не так — оставляем как есть
  }
}

/**
 * POST /api/media
 */
async function uploadMedia(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не выбраны' });
    }

    const { description, tags, categoryId, isPublic } = req.body;
    const userId = req.session.user.id;
    const results = [];
    const publicRoot = path.join(__dirname, '..', 'public');

    for (const file of req.files) {
      const relPath = '/' + path
        .relative(publicRoot, file.path)
        .split(path.sep)
        .join('/');

      const media = await Media.create({
        title: decodeFilename(file.originalname),
        description: description || null,
        filePath: relPath,
        mimeType: file.mimetype,
        size: file.size,
        isPublic: isPublic !== 'false',
        userId,
        categoryId: categoryId ? Number(categoryId) : null,
      });

      if (tags && tags.trim()) {
        const names = [...new Set(
          tags.split(',').map(t => t.trim()).filter(Boolean)
        )];
        const instances = await Promise.all(
          names.map(name => Tag.findOrCreate({ where: { name } }))
        );
        await media.setTags(instances.map(([tag]) => tag));
      }

      results.push({
        id: media.id,
        title: media.title,
        filePath: media.filePath,
        mimeType: media.mimeType,
        size: media.size,
      });
    }

    res.status(201).json({
      message: `Загружено файлов: ${results.length}`,
      files: results,
    });
  } catch (err) {
    console.error('uploadMedia error:', err);
    res.status(500).json({ error: err.message || 'Ошибка загрузки' });
  }
}

/**
 * GET /api/media
 */
async function listMedia(req, res) {
  try {
    const { q, date, tag } = req.query;
    const where = { isHidden: false, isPublic: true };

    if (q) {
      where.title = { [Op.iLike]: `%${q}%` };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

    const include = [
      { model: User, as: 'author', attributes: ['id', 'login'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
    ];

    if (tag) {
      include.push({
        model: Tag,
        as: 'tags',
        where: { name: tag },
        through: { attributes: [] },
      });
    } else {
      include.push({
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
      });
    }

    const media = await Media.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json(media);
  } catch (err) {
    console.error('listMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/media/:id — одна запись с полными данными
 */
async function getMediaById(req, res) {
  try {
    const media = await Media.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'login'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });

    if (!media) {
      return res.status(404).json({ error: 'Медиа не найдено' });
    }

    // Проверка доступа: приватное видят только автор и админ
    const currentUser = req.session?.user;
    const isOwner = currentUser && currentUser.id === media.userId;
    const isAdmin = currentUser && currentUser.role === 'admin';

    if ((!media.isPublic || media.isHidden) && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    res.json(media);
  } catch (err) {
    console.error('getMediaById error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/media/:id/download — отдаёт файл на скачивание
 */
async function downloadMedia(req, res) {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Медиа не найдено' });
    }

    const currentUser = req.session?.user;
    const isOwner = currentUser && currentUser.id === media.userId;
    const isAdmin = currentUser && currentUser.role === 'admin';

    if ((!media.isPublic || media.isHidden) && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // filePath = /uploads/2026/09/hash.jpg → путь на диске
    const fs = require('fs');
    const absPath = path.join(__dirname, '..', 'public', media.filePath);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Файл не найден на сервере' });
    }

    // download заставляет браузер скачать, а не открыть
    res.download(absPath, media.title);
  } catch (err) {
    console.error('downloadMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/media/my — список файлов текущего пользователя
 */
async function listMyMedia(req, res) {
  try {
    const userId = req.session.user.id;
    const { Op } = require('sequelize');

    const media = await Media.findAll({
      where: { userId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(media);
  } catch (err) {
    console.error('listMyMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * DELETE /api/media/:id — удалить свой файл (или админ — любой)
 */
async function deleteMedia(req, res) {
  try {
    const fs = require('fs');
    const media = await Media.findByPk(req.params.id);

    if (!media) {
      return res.status(404).json({ error: 'Медиа не найдено' });
    }

    const currentUser = req.session.user;
    const isOwner = currentUser.id === media.userId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Можно удалять только свои файлы' });
    }

    // Удаляем файл с диска
    const absPath = path.join(__dirname, '..', 'public', media.filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }

    // Удаляем запись из БД
    // (ассоциации через belongsToMany удалятся каскадно, если настроено)
    await media.destroy();

    res.json({ message: 'Файл удалён' });
  } catch (err) {
    console.error('deleteMedia error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = {
  uploadMedia,
  listMedia,
  getMediaById,
  downloadMedia,
  listMyMedia,
  deleteMedia,
};