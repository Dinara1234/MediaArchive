// public/js/media.js
$(function () {
  const container = $('#media-container');
  const id = window.MEDIA_ID;

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPreview(m) {
    const mime = m.mimeType || '';
    if (mime.startsWith('image/')) {
      return `<img src="${m.filePath}" alt="${escapeHtml(m.title)}" class="media-full">`;
    }
    if (mime.startsWith('video/')) {
      return `<video src="${m.filePath}" controls class="media-full"></video>`;
    }
    if (mime.startsWith('audio/')) {
      return `<audio src="${m.filePath}" controls class="media-audio"></audio>`;
    }
    return `<div class="file-icon-big">📄</div>`;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
  }

  function render(m) {
    const tags = (m.tags || []).map(t =>
      `<a href="/?tag=${encodeURIComponent(t.name)}" class="tag">${escapeHtml(t.name)}</a>`
    ).join(' ');

    const author = m.author ? m.author.login : 'неизвестно';
    const date = new Date(m.createdAt).toLocaleString('ru-RU');
    const category = m.category ? m.category.name : '—';

    container.html(`
      <div class="media-view">
        <div class="media-view-preview">${renderPreview(m)}</div>
        <div class="media-view-info">
          <h2>${escapeHtml(m.title)}</h2>
          <p class="meta">
            👤 <b>${escapeHtml(author)}</b> · 📅 ${date}
          </p>
          <p class="meta">📂 Категория: ${escapeHtml(category)}</p>
          <p class="meta">📦 Размер: ${formatSize(m.size)} · ${escapeHtml(m.mimeType)}</p>

          ${m.description ? `<p class="description">${escapeHtml(m.description)}</p>` : ''}

          ${tags ? `<div class="tags">${tags}</div>` : ''}

          <div class="actions">
            <a href="/api/media/${m.id}/download" class="btn">⬇ Скачать</a>
          </div>
        </div>
      </div>
    `);
  }

  // Загрузка данных
  $.ajax({
    url: '/api/media/' + id,
    method: 'GET',
  })
    .done(function (m) {
      render(m);
    })
    .fail(function (xhr) {
      const err = xhr.responseJSON?.error || 'Ошибка загрузки';
      container.html(`<p style="color:red;">${err}</p>`);
    });
});