// middleware/auth.js

/**
 * requireAuth — пропускает только авторизованных (роль user или admin)
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  next();
}

/**
 * requireRole — пропускает только пользователей с указанной ролью
 * Использование: router.get('/admin', requireRole('admin'), ...)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}

/**
 * attachUser — кладёт пользователя из сессии в res.locals
 * чтобы шаблоны (EJS/Pug) видели его без передачи в каждом рендере
 */
function attachUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  next();
}

module.exports = { requireAuth, requireRole, attachUser };