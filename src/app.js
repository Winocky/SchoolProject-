'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const adminRouter = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 день
  }),
);
app.use(flash());

// Глобальні змінні для шаблонів
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
  };
  next();
});

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/events', eventsRouter);
app.use('/admin', adminRouter);

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Сторінку не знайдено',
    message: 'На жаль, такої сторінки не існує.',
  });
});

// Глобальний обробник помилок
app.use((err, req, res, _next) => {
  console.error('[error]', err);
  res.status(500).render('error', {
    title: 'Помилка сервера',
    message: process.env.NODE_ENV === 'production'
      ? 'Виникла внутрішня помилка. Спробуйте пізніше.'
      : err.message,
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`> Сервер запущено на http://localhost:${port}`);
});
