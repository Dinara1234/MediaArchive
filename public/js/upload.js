// public/js/upload.js
$(function () {
  const dropZone = $('#drop-zone');
  const fileInput = $('#file-input');
  const fileList = $('#file-list');
  let files = [];   // DataTransfer.FileList

  // ─── Drag&drop ────────────────────────────────────
  dropZone.on('dragover dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.addClass('dragover');
  });

  dropZone.on('dragleave drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.removeClass('dragover');
  });

  dropZone.on('drop', function (e) {
    const dropped = e.originalEvent.dataTransfer.files;
    addFiles(dropped);
  });

  // ─── Выбор через диалог ──────────────────────────
  fileInput.on('change', function () {
    addFiles(this.files);
  });

  function addFiles(newFiles) {
    for (const f of newFiles) {
      // Защита от дублей по имени+размеру
      if (!files.some(x => x.name === f.name && x.size === f.size)) {
        files.push(f);
      }
    }
    renderList();
  }

  function renderList() {
    fileList.empty();
    files.forEach((f, idx) => {
      const sizeKb = (f.size / 1024).toFixed(1);
      const $li = $(`
        <li>
          <span class="name">${f.name}</span>
          <span class="size">${sizeKb} КБ</span>
          <button type="button" data-idx="${idx}" class="remove">×</button>
        </li>
      `);
      fileList.append($li);
    });
  }

  fileList.on('click', '.remove', function () {
    const idx = $(this).data('idx');
    files.splice(idx, 1);
    renderList();
  });

  // ─── Отправка на сервер ──────────────────────────
  $('#upload-form').on('submit', function (e) {
    e.preventDefault();

    if (files.length === 0) {
      $('#message').css('color', 'red').text('Выберите хотя бы один файл');
      return;
    }

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('description', $('textarea[name=description]').val());
    formData.append('tags', $('input[name=tags]').val());
    formData.append('categoryId', $('select[name=categoryId]').val());
    formData.append('isPublic', $('input[name=isPublic]').is(':checked'));

    $('#submit-btn').prop('disabled', true).text('Загрузка...');
    $('#message').text('');
    $('#progress').text('0%');

    $.ajax({
      url: '/api/media',
      method: 'POST',
      data: formData,
      processData: false,   // важно для FormData
      contentType: false,   // важно для FormData
      xhr: function () {
        const xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function (e) {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            $('#progress').text(pct + '%');
          }
        });
        return xhr;
      },
    })
      .done(function (res) {
        $('#message').css('color', 'green')
          .text(`Успешно: ${res.message}`);
        files = [];
        renderList();
        $('#progress').text('100%');
        setTimeout(() => { window.location.href = '/'; }, 1200);
      })
      .fail(function (xhr) {
        const err = xhr.responseJSON?.error || 'Ошибка загрузки';
        $('#message').css('color', 'red').text(err);
      })
      .always(function () {
        $('#submit-btn').prop('disabled', false).text('Загрузить');
      });
  });
});