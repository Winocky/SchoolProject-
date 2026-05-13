'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RX = /^(?=.*[A-Za-zА-Яа-яЇїІіЄєҐґ])(?=.*\d).{6,}$/;

router.get('/register', (req, res) => {
  res.render('register', { title: 'Реєстрація', form: {}, errors: [] });
});

router.post('/register', async (req, res, next) => {
  try {
    const { name = '', email = '', password = '', phone = '' } = req.body;
    const errors = [];

    if (name.trim().length < 2) errors.push('Ім\'я має містити мінімум 2 символи.');
    if (!EMAIL_RX.test(email)) errors.push('Невірний формат email.');
    if (!PASSWORD_RX.test(password)) {
      errors.push('Пароль має містити мінімум 6 символів, букву та цифру.');
    }

    if (errors.length === 0) {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) errors.push('Користувач з таким email вже існує.');
    }

    if (errors.length > 0) {
      return res.status(400).render('register', {
        title: 'Реєстрація',
        form: { name, email, phone },
        errors,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [name.trim(), email.trim(), passwordHash, phone.trim() || null],
    );

    req.session.user = {
      id: result.insertId,
      name: name.trim(),
      email: email.trim(),
      role: 'user',
    };
    req.flash('success', 'Реєстрація успішна! Ласкаво просимо.');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Вхід', form: {}, errors: [] });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email = '', password = '' } = req.body;
    const errors = [];

    if (!EMAIL_RX.test(email)) errors.push('Невірний формат email.');
    if (password.length < 1) errors.push('Введіть пароль.');

    if (errors.length === 0) {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        errors.push('Невірний email або пароль.');
      } else {
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
          errors.push('Невірний email або пароль.');
        } else {
          req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
          req.flash('success', `Вітаємо, ${user.name}!`);
          return res.redirect(user.role === 'admin' ? '/admin' : '/');
        }
      }
    }

    res.status(400).render('login', {
      title: 'Вхід',
      form: { email },
      errors,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
