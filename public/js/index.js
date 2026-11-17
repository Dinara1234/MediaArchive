// public/js/index.js
$(function () {
  const grid = $('#media-grid');
  const loading = $('#loading');
  const empty = $('#empty');

  // ─── Загрузка ленты ───────────────────────────────
  function loadMedia(params = {}) {
    grid.html('<p id="loading">Загрузка...</p>');
    empty.hide();

    $.ajax({
      url: '/api/media',
      method: 'GET',
      data: params,
    })
      .done(function (list) {
        renderMedia(list);
      })
      .fail(function () {
        grid.html('<p style="color:red;">Ошибка загрузки</p>');
      });
  }

  // ─── Рендер карточек ──────────────────────────────
  function renderMedia(list) {
    grid.empty();

    if (!list || list.length === 0) {
      empty.show();
      return;
    }

    list.forEach(function (m) {
      const card = buildCard(m);
      grid.append(card);
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

    const tags = (m.tags || []).map(t =>
      `<span class="tag">${escapeHtml(t.name)}</span>`
    ).join(' ');

    const author = m.author ? m.author.login : 'неизвестно';
    const date = new Date(m.createdAt).toLocaleDateString('ru-RU');

    // Вся карточка — ссылка на страницу медиа
    return $(`
      <a class="media-card" href="/media/${m.id}">
        <div class="media-preview">${preview}</div>
        <div class="media-info">
          <h3 title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
          <p class="meta">👤 ${escapeHtml(author)} · 📅 ${date}</p>
          <div class="tags">${tags}</div>
        </div>
      </a>
    `);
  }

  // ─── Экранирование HTML ───────────────────────────
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Поиск и фильтры ──────────────────────────────
  $('#search-btn').on('click', function () {
    const params = {};
    const q = $('#search-q').val().trim();
    const date = $('#search-date').val();
    const tag = $('#search-tag').val().trim();

    if (q) params.q = q;
    if (date) params.date = date;
    if (tag) params.tag = tag;

    loadMedia(params);
  });

  // Поиск по Enter
  $('#search-q, #search-tag').on('keypress', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#search-btn').click();
    }
  });

  $('#reset-btn').on('click', function () {
    $('#search-q').val('');
    $('#search-date').val('');
    $('#search-tag').val('');
    loadMedia();
  });

  // ─── Автозагрузка фильтра из URL (?tag=...) ───────
  const urlParams = new URLSearchParams(window.location.search);
  const tagFromUrl = urlParams.get('tag');
  const qFromUrl = urlParams.get('q');
  const dateFromUrl = urlParams.get('date');

  const initialParams = {};
  if (tagFromUrl) {
    initialParams.tag = tagFromUrl;
    $('#search-tag').val(tagFromUrl);
  }
  if (qFromUrl) {
    initialParams.q = qFromUrl;
    $('#search-q').val(qFromUrl);
  }
  if (dateFromUrl) {
    initialParams.date = dateFromUrl;
    $('#search-date').val(dateFromUrl);
  }

  // ─── Стартовая загрузка ───────────────────────────
  loadMedia(initialParams);
});