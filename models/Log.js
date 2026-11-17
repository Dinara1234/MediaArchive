const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,               // 'hide_media', 'deactivate_user' и т.д.
  },
  entity: {
    type: DataTypes.STRING(50),
    allowNull: true,                // 'Media', 'User', 'Category'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'logs',
});

module.exports = Log;