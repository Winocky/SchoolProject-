'use strict';

const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const mailer = require('../mailer');

const router = express.Router();

// Деталі заходу
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).render('error', {
        title: 'Не знайдено',
        message: 'Захід не знайдено.',
      });
    }

    const [rows] = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
       FROM events e WHERE e.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).render('error', {
        title: 'Не знайдено',
        message: 'Захід не знайдено.',
      });
    }

    const event = rows[0];
    let alreadyRegistered = false;
    if (req.session.user) {
      const [reg] = await db.query(
        'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?',
        [req.session.user.id, id],
      );
      alreadyRegistered = reg.length > 0;
    }

    res.render('event', {
      title: event.title,
      event,
      alreadyRegistered,
    });
  } catch (err) {
    next(err);
  }
});

// Реєстрація на захід
router.post('/:id/signup', requireLogin, async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.session.user.id;

    const [eventRows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
      req.flash('error', 'Захід не знайдено.');
      return res.redirect('/');
    }
    const event = eventRows[0];

    if (new Date(event.event_date) < new Date()) {
      req.flash('error', 'Реєстрація на цей захід вже закрита.');
      return res.redirect(`/events/${eventId}`);
    }

    const [countRows] = await db.query(
      'SELECT COUNT(*) AS c FROM registrations WHERE event_id = ?',
      [eventId],
    );
    if (countRows[0].c >= event.max_seats) {
      req.flash('error', 'На жаль, всі місця зайнято.');
      return res.redirect(`/events/${eventId}`);
    }

    try {
      await db.query(
        'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)',
        [userId, eventId],
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'Ви вже зареєстровані на цей захід.');
        return res.redirect(`/events/${eventId}`);
      }
      throw err;
    }

    // Відправити email-підтвердження
    try {
      await mailer.sendRegistrationConfirmation(req.session.user, event);
    } catch (mailErr) {
      console.error('[mailer] помилка надсилання:', mailErr.message);
    }

    req.flash('success', 'Реєстрація успішна! Підтвердження надіслано на email.');
    res.redirect(`/events/${eventId}`);
  } catch (err) {
    next(err);
  }
});

// Скасування реєстрації
router.post('/:id/cancel', requireLogin, async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    await db.query(
      'DELETE FROM registrations WHERE user_id = ? AND event_id = ?',
      [req.session.user.id, eventId],
    );
    req.flash('success', 'Реєстрацію скасовано.');
    res.redirect(`/events/${eventId}`);
  } catch (err) {
    next(err);
  }
});

// Мої реєстрації
router.get('/my/list', requireLogin, async (req, res, next) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, r.registered_at
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?
       ORDER BY e.event_date ASC`,
      [req.session.user.id],
    );
    res.render('my-registrations', {
      title: 'Мої реєстрації',
      events,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
