// controllers/authController.js
const bcrypt = require('bcrypt');
const { User } = require('../models');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * body: { login, email, password }
 */
exports.register = async (req, res) => {
  try {
    const { login, email, password } = req.body;

    // Валидация
    if (!login || !email || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    // Проверка уникальности
    const existing = await User.findOne({
      where: { login },
    });
    if (existing) {
      return res.status(409).json({ error: 'Логин уже занят' });
    }

    const emailTaken = await User.findOne({ where: { email } });
    if (emailTaken) {
      return res.status(409).json({ error: 'Email уже используется' });
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Создание пользователя. Роль по умолчанию — 'user'.
    const user = await User.create({
      login,
      email,
      passwordHash,
      role: 'user',
    });

    // Сразу логиним пользователя
    req.session.user = {
      id: user.id,
      login: user.login,
      role: user.role,
    };

    res.status(201).json({
      message: 'Регистрация успешна',
      user: { id: user.id, login: user.login, role: user.role },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

/**
 * POST /api/auth/login
 * body: { login, password }
 */
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' });
    }

    const user = await User.findOne({ where: { login } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка блокировки (деактивации админом)
    if (!user.isActive) {
      return res.status(403).json({ error: 'Учётная запись деактивирована' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Кладём в сессию только самое необходимое
    req.session.user = {
      id: user.id,
      login: user.login,
      role: user.role,
    };

    res.json({
      message: 'Вход выполнен',
      user: req.session.user,
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
      return res.status(500).json({ error: 'Ошибка выхода' });
    }
    res.clearCookie('connect.sid'); // имя cookie по умолчанию
    res.json({ message: 'Выход выполнен' });
  });
};

/**
 * GET /api/auth/me — текущий пользователь (или null для гостя)
 */
exports.me = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ user: null });   // гость
  }
  res.json({ user: req.session.user });
};