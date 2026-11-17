// public/js/utils.js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();       // Node.js (для Mocha)
  } else {
    root.MediaUtils = factory();      // Браузер (window.MediaUtils)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('ru-RU');
  }

  return { escapeHtml, formatSize, formatDate };
});