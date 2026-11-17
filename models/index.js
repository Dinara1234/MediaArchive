const sequelize = require('../config/database');

const User = require('./User');
const Media = require('./Media');
const Category = require('./Category');
const Tag = require('./Tag');
const Album = require('./Album');
const Log = require('./Log');

// ─── Ассоциации ─────────────────────────────────────────

// Пользователь ↔ Медиа (1:N)
User.hasMany(Media, { foreignKey: 'userId', as: 'media' });
Media.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Категория ↔ Медиа (1:N)
Category.hasMany(Media, { foreignKey: 'categoryId', as: 'media' });
Media.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Медиа ↔ Теги (M:N)
Media.belongsToMany(Tag, {
  through: 'media_tags',
  foreignKey: 'mediaId',
  otherKey: 'tagId',
  as: 'tags',
});
Tag.belongsToMany(Media, {
  through: 'media_tags',
  foreignKey: 'tagId',
  otherKey: 'mediaId',
  as: 'media',
});

// Пользователь ↔ Альбомы (1:N)
User.hasMany(Album, { foreignKey: 'userId', as: 'albums' });
Album.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Альбом ↔ Медиа (M:N)
Album.belongsToMany(Media, {
  through: 'album_media',
  foreignKey: 'albumId',
  otherKey: 'mediaId',
  as: 'media',
});
Media.belongsToMany(Album, {
  through: 'album_media',
  foreignKey: 'mediaId',
  otherKey: 'albumId',
  as: 'albums',
});

// Пользователь ↔ Логи (1:N)
User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });
Log.belongsTo(User, { foreignKey: 'userId', as: 'admin' });

// ─── Экспорт ────────────────────────────────────────────

module.exports = {
  sequelize,
  User,
  Media,
  Category,
  Tag,
  Album,
  Log,
};