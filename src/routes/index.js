'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// Головна сторінка зі списком заходів та фільтрами
router.get('/', async (req, res, next) => {
  try {
    const { category, from, to, q } = req.query;
    const where = ['event_date >= NOW()'];
    const params = [];

    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (from) {
      where.push('event_date >= ?');
      params.push(from);
    }
    if (to) {
      where.push('event_date <= ?');
      params.push(to + ' 23:59:59');
    }
    if (q) {
      where.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    const sql =
      `SELECT e.*,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
       FROM events e
       WHERE ${where.join(' AND ')}
       ORDER BY event_date ASC`;
    const [events] = await db.query(sql, params);

    const [categoryRows] = await db.query(
      'SELECT DISTINCT category FROM events ORDER BY category',
    );

    res.render('home', {
      title: 'Майбутні заходи',
      events,
      categories: categoryRows.map((r) => r.category),
      filter: { category: category || '', from: from || '', to: to || '', q: q || '' },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
