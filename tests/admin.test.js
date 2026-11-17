// tests/admin.test.js
const request = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcrypt');
const app = require('../server');
const { User } = require('../models');

describe('Admin API', () => {
  let adminAgent;
  let userAgent;
  let victim;

  // ─── Подготовка ──────────────────────────────────
  before(async () => {
    await User.create({
      login: 'testadmin',
      email: 'admin@test.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });

    victim = await User.create({
      login: 'victim',
      email: 'victim@test.com',
      passwordHash: await bcrypt.hash('pass123', 10),
      role: 'user',
    });

    adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({
      login: 'testadmin',
      password: 'admin123',
    });

    userAgent = request.agent(app);
    await userAgent.post('/api/auth/login').send({
      login: 'victim',
      password: 'pass123',
    });
  });

  // ─── Разграничение доступа ──────────────────────
  describe('Проверка ролей', () => {
    it('401 для гостя', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).to.equal(401);
    });

    it('403 для обычного пользователя', async () => {
      const res = await userAgent.get('/api/admin/stats');
      expect(res.status).to.equal(403);
    });

    it('200 для админа', async () => {
      const res = await adminAgent.get('/api/admin/stats');
      expect(res.status).to.equal(200);
    });
  });

  // ─── Статистика ──────────────────────────────────
  describe('GET /api/admin/stats', () => {
    it('возвращает объект со счётчиками', async () => {
      const res = await adminAgent.get('/api/admin/stats');
      expect(res.body).to.include.keys(
        'usersTotal', 'usersActive', 'mediaTotal', 'mediaPublic', 'mediaHidden'
      );
      expect(res.body.usersTotal).to.be.a('number');
    });
  });

  // ─── Список пользователей ────────────────────────
  describe('GET /api/admin/users', () => {
    it('возвращает массив пользователей', async () => {
      const res = await adminAgent.get('/api/admin/users');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2);
    });
  });

  // ─── Деактивация ─────────────────────────────────
  describe('PUT /api/admin/users/:id/deactivate', () => {
    let secondAdmin;

    before(async () => {
      // Создаём ВТОРОГО админа — с ним будем проверять запрет
      secondAdmin = await User.create({
        login: 'testadmin2',
        email: 'admin2@test.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
      });
    });

    it('деактивирует обычного пользователя', async () => {
      const res = await adminAgent.put(
        `/api/admin/users/${victim.id}/deactivate`
      );
      expect(res.status).to.equal(200);

      const updated = await User.findByPk(victim.id);
      expect(updated.isActive).to.equal(false);
    });

    it('деактивированный не может войти', async () => {
      const res = await request(app).post('/api/auth/login').send({
        login: 'victim',
        password: 'pass123',
      });
      expect(res.status).to.equal(403);
    });

    it('нельзя деактивировать себя (400)', async () => {
      // adminAgent залогинен под testadmin
      const self = await User.findOne({ where: { login: 'testadmin' } });
      const res = await adminAgent.put(
        `/api/admin/users/${self.id}/deactivate`
      );
      expect(res.status).to.equal(400);
    });

    it('нельзя деактивировать другого администратора (403)', async () => {
      const res = await adminAgent.put(
        `/api/admin/users/${secondAdmin.id}/deactivate`
      );
      expect(res.status).to.equal(403);
    });
  });
  // ─── Активация обратно ───────────────────────────
  describe('PUT /api/admin/users/:id/activate', () => {
    it('активирует пользователя', async () => {
      const res = await adminAgent.put(
        `/api/admin/users/${victim.id}/activate`
      );
      expect(res.status).to.equal(200);

      const updated = await User.findByPk(victim.id);
      expect(updated.isActive).to.equal(true);
    });
  });

  // ─── Журнал ──────────────────────────────────────
  describe('GET /api/admin/logs', () => {
    it('возвращает журнал действий', async () => {
      const res = await adminAgent.get('/api/admin/logs');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      // После деактивации/активации должны быть записи
      expect(res.body.length).to.be.at.least(2);
    });
  });
});