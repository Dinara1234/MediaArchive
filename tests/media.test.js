// tests/media.test.js
const request = require('supertest');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const app = require('../server');

describe('Media API', () => {
  let agent;         // авторизованный агент (с cookie)
  let mediaId;

  // ─── Подготовка ──────────────────────────────────
  before(async () => {
    agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      login: 'mediauser',
      email: 'media@example.com',
      password: 'secret123',
    });
  });

  // ─── Загрузка ────────────────────────────────────
  describe('POST /api/media', () => {
    it('отклоняет загрузку без авторизации', async () => {
      const res = await request(app).post('/api/media');
      expect(res.status).to.equal(401);
    });

    it('отклоняет загрузку без файлов', async () => {
      const res = await agent.post('/api/media').field('description', 'no files');
      expect(res.status).to.equal(400);
    });

    it('загружает файл', async () => {
      // Создаём тестовый файл
      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);

      const tmpFile = path.join(fixturesDir, 'test.jpg');
      // Минимальный валидный JPEG (4 байта) — только для теста MIME
      fs.writeFileSync(tmpFile, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]));

      const res = await agent
        .post('/api/media')
        .attach('files', tmpFile)
        .field('description', 'Тестовое описание')
        .field('tags', 'тест,мойтег')
        .field('isPublic', 'true');

      expect(res.status).to.equal(201);
      expect(res.body.files).to.be.an('array').with.lengthOf(1);
      mediaId = res.body.files[0].id;
    });
  });

  // ─── Лента ───────────────────────────────────────
  describe('GET /api/media', () => {
    it('возвращает список медиа', async () => {
      const res = await request(app).get('/api/media');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });

    it('находит по названию', async () => {
      const res = await request(app).get('/api/media?q=test');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });

    it('фильтрует по тегу', async () => {
      const res = await request(app).get('/api/media?tag=тест');
      expect(res.status).to.equal(200);
    });
  });

  // ─── Карточка ────────────────────────────────────
  describe('GET /api/media/:id', () => {
    it('возвращает медиа по id', async () => {
      const res = await request(app).get(`/api/media/${mediaId}`);
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(mediaId);
    });

    it('возвращает 404 для несуществующего id', async () => {
      const res = await request(app).get('/api/media/999999');
      expect(res.status).to.equal(404);
    });
  });

  // ─── Мои загрузки ────────────────────────────────
  describe('GET /api/media/my', () => {
    it('возвращает свои файлы', async () => {
      const res = await agent.get('/api/media/my');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
    });

    it('возвращает 401 для гостя', async () => {
      const res = await request(app).get('/api/media/my');
      expect(res.status).to.equal(401);
    });
  });

  // ─── Удаление ────────────────────────────────────
  describe('DELETE /api/media/:id', () => {
    it('удаляет свой файл', async () => {
      const res = await agent.delete(`/api/media/${mediaId}`);
      expect(res.status).to.equal(200);
    });

    it('после удаления медиа не находится', async () => {
      const res = await request(app).get(`/api/media/${mediaId}`);
      expect(res.status).to.equal(404);
    });
  });
});