'use strict';

// Клієнтська валідація форми реєстрації
(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRx = /^(?=.*[A-Za-zА-Яа-яЇїІіЄєҐґ])(?=.*\d).{6,}$/;

  form.addEventListener('submit', function (e) {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    const errors = [];
    if (name.length < 2) errors.push("Ім'я має містити мінімум 2 символи.");
    if (!emailRx.test(email)) errors.push('Невірний формат email.');
    if (!passwordRx.test(password)) {
      errors.push('Пароль має містити мінімум 6 символів, букву та цифру.');
    }

    if (errors.length > 0) {
      e.preventDefault();
      alert(errors.join('\n'));
    }
  });
})();

// Авто-приховування flash-повідомлень
(function () {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(function (a) {
    setTimeout(function () {
      a.style.transition = 'opacity 0.5s';
      a.style.opacity = '0';
      setTimeout(function () { a.remove(); }, 500);
    }, 4000);
  });
})();

// Підтвердження видалення (універсальне)
(function () {
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!confirm(f.dataset.confirm)) e.preventDefault();
    });
  });
})();
