// public/js/admin.js
$(function () {
  const currentUserId = null;   // можно получить через /api/auth/me, но нам не критично

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

  function fmtDate(d) {
    return new Date(d).toLocaleString('ru-RU');
  }

  // ─── Табы ─────────────────────────────────────────
  $('.tab-btn').on('click', function () {
    const tab = $(this).data('tab');
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    $('.tab-panel').removeClass('active');
    $('#tab-' + tab).addClass('active');

    // Ленивая загрузка
    if (tab === 'media' && !$('#tab-media').data('loaded')) {
      loadMedia();
      $('#tab-media').data('loaded', true);
    }
    if (tab === 'users' && !$('#tab-users').data('loaded')) {
      loadUsers();
      $('#tab-users').data('loaded', true);
    }
    if (tab === 'logs' && !$('#tab-logs').data('loaded')) {
      loadLogs();
      $('#tab-logs').data('loaded', true);
    }
  });

  // ─── Статистика ───────────────────────────────────
  function loadStats() {
    $.get('/api/admin/stats', function (s) {
      $('#stat-users').text(s.usersTotal);
      $('#stat-active').text(s.usersActive);
      $('#stat-media').text(s.mediaTotal);
      $('#stat-public').text(s.mediaPublic);
      $('#stat-hidden').text(s.mediaHidden);
    });
  }

  // ═════════════════════════════════════════════════
  //  МОДЕРАЦИЯ МЕДИА
  // ═════════════════════════════════════════════════
  function loadMedia(params = {}) {
    const box = $('#media-list');
    box.html('<p>Загрузка...</p>');

    $.ajax({
      url: '/api/admin/media',
      method: 'GET',
      data: params,
    })
      .done(function (list) {
        renderMedia(list);
      })
      .fail(function () {
        box.html('<p style="color:red;">Ошибка загрузки</p>');
      });
  }

  function renderMedia(list) {
    const box = $('#media-list');
    box.empty();

    if (!list || list.length === 0) {
      box.html('<p style="color:#888;">Ничего не найдено</p>');
      return;
    }

    list.forEach(function (m) {
      box.append(buildMediaRow(m));
    });
  }

  function buildMediaRow(m) {
    const isImage = m.mimeType && m.mimeType.startsWith('image/');

    const preview = isImage
      ? `<img src="${m.filePath}" alt="">`
      : `<div class="file-icon-sm">📄</div>`;

    const badges = [];
    if (m.isHidden) badges.push('<span class="badge badge-hidden">🚫 Скрыто</span>');
    if (!m.isPublic) badges.push('<span class="badge badge-private">🔒 Приватное</span>');
    if (m.isPublic && !m.isHidden) badges.push('<span class="badge badge-ok">✓ Публичное</span>');

    const author = m.author ? m.author.login : '—';
    const date = fmtDate(m.createdAt);

    return $(`
      <div class="admin-media-row" data-id="${m.id}">
        <div class="amr-preview">${preview}</div>
        <div class="amr-info">
          <div class="amr-title">
            <a href="/media/${m.id}" target="_blank">${escapeHtml(m.title)}</a>
          </div>
          <div class="amr-meta">
            👤 ${escapeHtml(author)} · 📅 ${date} · 📦 ${formatSize(m.size)}
          </div>
          <div class="amr-badges">${badges.join(' ')}</div>
        </div>
        <div class="amr-actions">
          ${m.isHidden
            ? `<button class="btn btn-sm btn-unhide" data-id="${m.id}">Опубликовать</button>`
            : `<button class="btn btn-sm btn-hide" data-id="${m.id}">Скрыть</button>`
          }
          <button class="btn btn-sm btn-danger btn-delete" data-id="${m.id}" data-title="${escapeHtml(m.title)}">Удалить</button>
        </div>
      </div>
    `);
  }

  // Модерация — скрыть
  $('#media-list').on('click', '.btn-hide', function () {
    const id = $(this).data('id');
    $.ajax({ url: `/api/admin/media/${id}/hide`, method: 'PUT' })
      .done(function () { refreshMediaAndStats(); })
      .fail(function (xhr) { alert(xhr.responseJSON?.error || 'Ошибка'); });
  });

  // Модерация — опубликовать
  $('#media-list').on('click', '.btn-unhide', function () {
    const id = $(this).data('id');
    $.ajax({ url: `/api/admin/media/${id}/unhide`, method: 'PUT' })
      .done(function () { refreshMediaAndStats(); })
      .fail(function (xhr) { alert(xhr.responseJSON?.error || 'Ошибка'); });
  });

  // Модерация — удалить
  $('#media-list').on('click', '.btn-delete', function () {
    const id = $(this).data('id');
    const title = $(this).data('title');
    if (!confirm(`Удалить файл "${title}"? Действие необратимо.`)) return;

    $.ajax({ url: `/api/admin/media/${id}`, method: 'DELETE' })
      .done(function () { refreshMediaAndStats(); })
      .fail(function (xhr) { alert(xhr.responseJSON?.error || 'Ошибка'); });
  });

  function refreshMediaAndStats() {
    const params = {};
    const q = $('#media-q').val().trim();
    if (q) params.q = q;
    loadMedia(params);
    loadStats();
  }

  $('#media-search-btn').on('click', refreshMediaAndStats);
  $('#media-q').on('keypress', function (e) {
    if (e.which === 13) { e.preventDefault(); refreshMediaAndStats(); }
  });
  $('#media-reset-btn').on('click', function () {
    $('#media-q').val('');
    refreshMediaAndStats();
  });

  // ═════════════════════════════════════════════════
  //  ПОЛЬЗОВАТЕЛИ
  // ═════════════════════════════════════════════════
  function loadUsers() {
    const tbody = $('#users-table tbody');
    tbody.html('<tr><td colspan="7">Загрузка...</td></tr>');

    $.get('/api/admin/users', function (list) {
      tbody.empty();
      if (!list || list.length === 0) {
        tbody.html('<tr><td colspan="7">Нет пользователей</td></tr>');
        return;
      }
      list.forEach(function (u) {
        tbody.append(buildUserRow(u));
      });
    }).fail(function () {
      tbody.html('<tr><td colspan="7" style="color:red;">Ошибка загрузки</td></tr>');
    });
  }

  function buildUserRow(u) {
    const status = u.isActive
      ? '<span class="badge badge-ok">Активен</span>'
      : '<span class="badge badge-hidden">Деактивирован</span>';

    const roleBadge = u.role === 'admin'
      ? '<span class="badge badge-admin">Админ</span>'
      : '<span class="badge">Пользователь</span>';

    const actions = u.role === 'admin'
      ? '<span style="color:#999; font-size:13px;">—</span>'
      : (u.isActive
          ? `<button class="btn btn-sm btn-danger btn-deactivate" data-id="${u.id}" data-login="${escapeHtml(u.login)}">Деактивировать</button>`
          : `<button class="btn btn-sm btn-activate" data-id="${u.id}" data-login="${escapeHtml(u.login)}">Активировать</button>`
        );

    return $(`
      <tr>
        <td>${u.id}</td>
        <td>${escapeHtml(u.login)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${roleBadge}</td>
        <td>${status}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
        <td>${actions}</td>
      </tr>
    `);
  }

  $('#users-table').on('click', '.btn-deactivate', function () {
    const id = $(this).data('id');
    const login = $(this).data('login');
    if (!confirm(`Деактивировать пользователя "${login}"? Он не сможет войти.`)) return;

    $.ajax({ url: `/api/admin/users/${id}/deactivate`, method: 'PUT' })
      .done(function () { loadUsers(); loadStats(); })
      .fail(function (xhr) { alert(xhr.responseJSON?.error || 'Ошибка'); });
  });

  $('#users-table').on('click', '.btn-activate', function () {
    const id = $(this).data('id');
    const login = $(this).data('login');
    if (!confirm(`Активировать пользователя "${login}"?`)) return;

    $.ajax({ url: `/api/admin/users/${id}/activate`, method: 'PUT' })
      .done(function () { loadUsers(); loadStats(); })
      .fail(function (xhr) { alert(xhr.responseJSON?.error || 'Ошибка'); });
  });

  // ═════════════════════════════════════════════════
  //  ЖУРНАЛ
  // ═════════════════════════════════════════════════
  function loadLogs() {
    const tbody = $('#logs-table tbody');
    tbody.html('<tr><td colspan="5">Загрузка...</td></tr>');

    $.get('/api/admin/logs', function (list) {
      tbody.empty();
      if (!list || list.length === 0) {
        tbody.html('<tr><td colspan="5">Журнал пуст</td></tr>');
        return;
      }

      const actionLabels = {
        hide_media: '🚫 Скрытие медиа',
        unhide_media: '✓ Публикация медиа',
        delete_media: '🗑 Удаление медиа',
        deactivate_user: '⛔ Деактивация пользователя',
        activate_user: '✓ Активация пользователя',
      };

      list.forEach(function (l) {
        const admin = l.admin ? l.admin.login : '—';
        const action = actionLabels[l.action] || l.action;

        tbody.append(`
          <tr>
            <td>${fmtDate(l.createdAt)}</td>
            <td>${escapeHtml(admin)}</td>
            <td>${escapeHtml(action)}</td>
            <td>${escapeHtml(l.entity || '')}</td>
            <td>${l.entityId || ''}</td>
          </tr>
        `);
      });
    }).fail(function () {
      tbody.html('<tr><td colspan="5" style="color:red;">Ошибка загрузки</td></tr>');
    });
  }

  // ─── Старт ────────────────────────────────────────
  loadStats();
  loadMedia();
  $('#tab-media').data('loaded', true);
});