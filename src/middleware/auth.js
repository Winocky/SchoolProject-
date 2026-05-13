'use strict';

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Будь ласка, увійдіть, щоб продовжити.');
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Доступ лише для адміністраторів.');
    return res.redirect('/');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
