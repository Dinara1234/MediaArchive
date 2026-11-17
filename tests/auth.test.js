// tests/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Auth API', () => {
  const testUser = {
    login: 'testuser',
    email: 'test@example.com',
    password: 'secret123',
  };

  // ─── Регистрация ─────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('регистрирует нового пользователя', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).to.equal(201);
      expect(res.body.user).to.have.property('login', testUser.login);
      expect(res.body.user).to.have.property('role', 'user');
    });

    it('возвращает 409 при дубликате логина', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).to.equal(409);
    });

    it('возвращает 400 при коротком пароле', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ login: 'x', email: 'x@x.com', password: '123' });

      expect(res.status).to.equal(400);
    });

    it('возвращает 400 при пустых полях', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).to.equal(400);
    });
  });

  // ─── Вход ────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('логинит с правильными данными', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ login: testUser.login, password: testUser.password });

      expect(res.status).to.equal(200);
      expect(res.body.user).to.have.property('login', testUser.login);
    });

    it('отклоняет неверный пароль', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ login: testUser.login, password: 'wrong-password' });

      expect(res.status).to.equal(401);
    });

    it('отклоняет несуществующего пользователя', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ login: 'nobody', password: 'whatever' });

      expect(res.status).to.equal(401);
    });
  });

  // ─── Текущий пользователь ────────────────────────
  describe('GET /api/auth/me', () => {
    it('возвращает null для гостя', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(200);
      expect(res.body.user).to.equal(null);
    });

    it('возвращает пользователя для авторизованного', async () => {
      // agent сохраняет cookie между запросами
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({ login: testUser.login, password: testUser.password });

      const res = await agent.get('/api/auth/me');
      expect(res.status).to.equal(200);
      expect(res.body.user).to.have.property('login', testUser.login);
    });
  });

  // ─── Выход ───────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('сбрасывает сессию', async () => {
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({ login: testUser.login, password: testUser.password });

      await agent.post('/api/auth/logout');

      const res = await agent.get('/api/auth/me');
      expect(res.body.user).to.equal(null);
    });
  });
});