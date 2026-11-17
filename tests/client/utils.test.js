// tests/client/utils.test.js
const { expect } = require('chai');
const { escapeHtml, formatSize, formatDate } = require('../../public/js/utils');

describe('Client utils', () => {
  describe('escapeHtml', () => {
    it('экранирует угловые скобки', () => {
      expect(escapeHtml('<script>alert(1)</script>'))
        .to.equal('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('экранирует амперсанд', () => {
      expect(escapeHtml('a & b')).to.equal('a &amp; b');
    });

    it('экранирует двойные и одинарные кавычки', () => {
      expect(escapeHtml(`"'"`)).to.equal('&quot;&#39;&quot;');
    });

    it('возвращает пустую строку для null/undefined', () => {
      expect(escapeHtml(null)).to.equal('');
      expect(escapeHtml(undefined)).to.equal('');
    });

    it('не изменяет безопасный текст', () => {
      expect(escapeHtml('Привет, мир!')).to.equal('Привет, мир!');
    });
  });

  describe('formatSize', () => {
    it('байты', () => {
      expect(formatSize(500)).to.equal('500 Б');
    });

    it('килобайты', () => {
      expect(formatSize(2048)).to.equal('2.0 КБ');
    });

    it('мегабайты', () => {
      expect(formatSize(5 * 1024 * 1024)).to.equal('5.00 МБ');
    });
  });

  describe('formatDate', () => {
    it('форматирует дату в русском формате', () => {
      const result = formatDate('2026-09-21T12:00:00Z');
      expect(result).to.match(/\d{2}\.\d{2}\.\d{4}/);
    });
  });
});