// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const { sequelize } = require('./models');
const { attachUser, requireAuth, requireRole } = require('./middleware/auth');

const app = express();

// ─── Базовые middleware ────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Сессии ────────────────────────────────────────────
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                          // cookie недоступна из JS
    maxAge: 1000 * 60 * 60 * 24 * 7,         // 7 дней
    sameSite: 'lax',
    // secure: true,                         // включить при HTTPS
  },
}));

// ─── Шаблонизатор ──────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Кладём текущего пользователя в res.locals (для шаблонов)
app.use(attachUser);

// ─── Маршруты ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/media', require('./routes/media'));    // ← добавьте
// Маршруты
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.render('index');
});

// Страницы (views)
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/upload', requireAuth, (req, res) => res.render('upload'));
app.get('/media/:id', (req, res) => res.render('media', { mediaId: req.params.id }));
app.get('/my', requireAuth, (req, res) => res.render('my'));
app.get('/admin', requireAuth, requireRole('admin'), (req, res) => res.render('admin'));

// ─── Запуск ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Таблицы синхронизированы');
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
  }
}

// Запускаем сервер только если файл вызван напрямую (node server.js),
// но не когда его подключают тесты (require('../server'))
if (require.main === module) {
  start();
}

module.exports = app;