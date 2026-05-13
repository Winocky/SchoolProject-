'use strict';

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

// Панель адміністратора
router.get('/', async (req, res, next) => {
  try {
    const [events] = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
       FROM events e
       ORDER BY event_date DESC`,
    );
    const [usersCount] = await db.query('SELECT COUNT(*) AS c FROM users');
    const [regsCount] = await db.query('SELECT COUNT(*) AS c FROM registrations');

    res.render('admin/dashboard', {
      title: 'Адмін-панель',
      events,
      stats: {
        events: events.length,
        users: usersCount[0].c,
        registrations: regsCount[0].c,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Форма створення заходу
router.get('/events/new', (req, res) => {
  res.render('admin/event-form', {
    title: 'Новий захід',
    event: null,
    errors: [],
  });
});

// Створення заходу
router.post('/events', async (req, res, next) => {
  try {
    const { title, description, event_date, location, category, max_seats, image_url } = req.body;
    const errors = validateEvent(req.body);
    if (errors.length > 0) {
      return res.status(400).render('admin/event-form', {
        title: 'Новий захід',
        event: req.body,
        errors,
      });
    }

    await db.query(
      `INSERT INTO events (title, description, event_date, location, category, max_seats, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        event_date,
        location.trim(),
        category || 'general',
        Number(max_seats) || 100,
        image_url ? image_url.trim() : null,
        req.session.user.id,
      ],
    );

    req.flash('success', 'Захід створено.');
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

// Форма редагування
router.get('/events/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      req.flash('error', 'Захід не знайдено.');
      return res.redirect('/admin');
    }
    // Форматування дати для input[type=datetime-local]
    const ev = rows[0];
    ev.event_date_input = formatDateForInput(ev.event_date);

    res.render('admin/event-form', {
      title: 'Редагування заходу',
      event: ev,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
});

// Оновлення
router.post('/events/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const errors = validateEvent(req.body);
    if (errors.length > 0) {
      const eventWithId = { ...req.body, id, event_date_input: req.body.event_date };
      return res.status(400).render('admin/event-form', {
        title: 'Редагування заходу',
        event: eventWithId,
        errors,
      });
    }

    const { title, description, event_date, location, category, max_seats, image_url } = req.body;
    await db.query(
      `UPDATE events
       SET title = ?, description = ?, event_date = ?, location = ?,
           category = ?, max_seats = ?, image_url = ?
       WHERE id = ?`,
      [
        title.trim(),
        description.trim(),
        event_date,
        location.trim(),
        category || 'general',
        Number(max_seats) || 100,
        image_url ? image_url.trim() : null,
        id,
      ],
    );

    req.flash('success', 'Захід оновлено.');
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

// Видалення
router.post('/events/:id/delete', async (req, res, next) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    req.flash('success', 'Захід видалено.');
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

// Список зареєстрованих на захід
router.get('/events/:id/registrations', async (req, res, next) => {
  try {
    const [eventRows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (eventRows.length === 0) {
      req.flash('error', 'Захід не знайдено.');
      return res.redirect('/admin');
    }

    const [users] = await db.query(
      `SELECT u.name, u.email, u.phone, r.registered_at
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = ?
       ORDER BY r.registered_at ASC`,
      [req.params.id],
    );

    res.render('admin/registrations', {
      title: `Реєстрації: ${eventRows[0].title}`,
      event: eventRows[0],
      users,
    });
  } catch (err) {
    next(err);
  }
});

// Список користувачів
router.get('/users', async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id) AS reg_count
       FROM users u
       ORDER BY u.created_at DESC`,
    );
    res.render('admin/users', { title: 'Користувачі', users });
  } catch (err) {
    next(err);
  }
});

function validateEvent(body) {
  const errors = [];
  if (!body.title || body.title.trim().length < 3) {
    errors.push('Назва заходу має бути не коротшою за 3 символи.');
  }
  if (!body.description || body.description.trim().length < 10) {
    errors.push('Опис має бути не коротшим за 10 символів.');
  }
  if (!body.event_date) {
    errors.push('Вкажіть дату та час заходу.');
  } else if (new Date(body.event_date) <= new Date()) {
    errors.push('Дата заходу має бути в майбутньому.');
  }
  if (!body.location || body.location.trim().length < 2) {
    errors.push('Вкажіть місце проведення.');
  }
  if (body.max_seats && (Number(body.max_seats) < 1 || Number(body.max_seats) > 100000)) {
    errors.push('Кількість місць має бути від 1 до 100000.');
  }
  return errors;
}

function formatDateForInput(dt) {
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = router;
