// tests/setup.js
require('dotenv').config();

// Переключаемся на тестовую БД ДО загрузки моделей
process.env.DB_NAME = process.env.DB_NAME_TEST || 'media_archive_test';
process.env.NODE_ENV = 'test';

const { sequelize } = require('../models');

// Root hooks — работают на верхнем уровне для всех spec-файлов
exports.mochaHooks = {
  async beforeAll() {
    // Пересоздаём все таблицы с нуля
    await sequelize.sync({ force: true });
    console.log('\n🧪 Тестовая БД пересоздана:', process.env.DB_NAME);
  },

  async afterAll() {
    await sequelize.close();
  },
};