const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,              // отключить вывод SQL в консоль
    pool: {
      max: 5,                    // максимум соединений
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,          // createdAt и updatedAt
      underscored: true,         // имена колонок в snake_case
    },
  }
);

// Проверка подключения
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL установлено');
  } catch (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
  }
}

testConnection();

module.exports = sequelize;