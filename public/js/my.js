// public/js/my.js
$(function () {
  const grid = $('#my-grid');
  const empty = $('#empty');

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

  function loadMyMedia() {
    grid.html('<p>Загрузка...</p>');
    empty.hide();

    $.ajax({
      url: '/api/media/my',
      method: 'GET',
    })
      .done(function (list) {
        render(list);
      })
      .fail(function (xhr) {
        const err = xhr.responseJSON?.error || 'Ошибка загрузки';
        grid.html(`<p style="color:red;">${err}</p>`);
      });
  }

  function render(list) {
    grid.empty();

    if (!list || list.length === 0) {
      empty.show();
      return;
    }

    list.forEach(function (m) {
      grid.append(buildCard(m));
    });
  }

  function buildCard(m) {
    const isImage = m.mimeType && m.mimeType.startsWith('image/');
    const isVideo = m.mimeType && m.mimeType.startsWith('video/');
    const isAudio = m.mimeType && m.mimeType.startsWith('audio/');

    let preview = '';
    if (isImage) {
      preview = `<img src="${m.filePath}" alt="${escapeHtml(m.title)}" loading="lazy">`;
    } else if (isVideo) {
      preview = `<video src="${m.filePath}" muted preload="metadata"></video>`;
    } else if (isAudio) {
      preview = `<div class="audio-icon">🎵</div>`;
    } else {
      preview = `<div class="file-icon">📄</div>`;
    }

    const statusBadges = [];
    if (!m.isPublic) statusBadges.push('<span class="badge badge-private">🔒 Приватное</span>');
    if (m.isHidden) statusBadges.push('<span class="badge badge-hidden">🚫 Скрыто модератором</span>');

    const date = new Date(m.createdAt).toLocaleDateString('ru-RU');

    return $(`
      <div class="media-card my-card" data-id="${m.id}">
        <a class="media-card-link" href="/media/${m.id}">
          <div class="media-preview">${preview}</div>
          <div class="media-info">
            <h3 title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
            <p class="meta">📅 ${date} · 📦 ${formatSize(m.size)}</p>
            <div class="badges">${statusBadges.join(' ')}</div>
          </div>
        </a>
        <div class="card-actions">
          <button class="btn-delete" data-id="${m.id}" data-title="${escapeHtml(m.title)}">
            🗑 Удалить
          </button>
        </div>
      </div>
    `);
  }

  // ─── Удаление ─────────────────────────────────────
  grid.on('click', '.btn-delete', function () {
    const id = $(this).data('id');
    const title = $(this).data('title');

    if (!confirm(`Удалить файл "${title}"? Действие необратимо.`)) return;

    const $btn = $(this);
    $btn.prop('disabled', true).text('Удаление...');

    $.ajax({
      url: '/api/media/' + id,
      method: 'DELETE',
    })
      .done(function () {
        // Убираем карточку из DOM
        $btn.closest('.media-card').fadeOut(200, function () {
          $(this).remove();
          if (grid.find('.media-card').length === 0) {
            empty.show();
          }
        });
      })
      .fail(function (xhr) {
        const err = xhr.responseJSON?.error || 'Ошибка удаления';
        alert(err);
        $btn.prop('disabled', false).text('🗑 Удалить');
      });
  });

  // Старт
  loadMyMedia();
});