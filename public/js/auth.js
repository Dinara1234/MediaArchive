$(document).ready(function () {
  // Регистрация
  $('#register-form').on('submit', function (e) {
    e.preventDefault();
    const data = {
      login: $('input[name=login]').val(),
      email: $('input[name=email]').val(),
      password: $('input[name=password]').val(),
    };

    $.ajax({
      url: '/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
    })
      .done(function (res) {
        $('#message').css('color', 'green').text('Успех! Переходим...');
        setTimeout(() => (window.location.href = '/'), 800);
      })
      .fail(function (xhr) {
        $('#message').css('color', 'red').text(xhr.responseJSON?.error || 'Ошибка');
      });
  });

  // Вход
  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    const data = {
      login: $('input[name=login]').val(),
      password: $('input[name=password]').val(),
    };

    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
    })
      .done(function () {
        window.location.href = '/';
      })
      .fail(function (xhr) {
        $('#message').css('color', 'red').text(xhr.responseJSON?.error || 'Ошибка');
      });
  });
});