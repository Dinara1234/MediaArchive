const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false,               // путь к файлу в public/uploads/
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,               // image/jpeg, video/mp4 и т.д.
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,               // размер файла в байтах
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,             // публичное или только для себя
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,            // скрыто администратором при модерации
  },
}, {
  tableName: 'media',
  indexes: [
    { fields: ['title'] },           // индекс для поиска по названию
    { fields: ['created_at'] },      // индекс для фильтрации по дате
  ],
});

module.exports = Media;