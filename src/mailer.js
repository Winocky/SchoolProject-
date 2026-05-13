'use strict';

const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    console.log(`[mailer] Використовується SMTP: ${host}`);
  } else {
    // Dev-режим: пишемо листи в консоль як JSON
    transporter = nodemailer.createTransport({ jsonTransport: true });
    console.log('[mailer] DEV-режим: листи виводяться в консоль (SMTP не налаштовано)');
  }
  return transporter;
}

async function sendRegistrationConfirmation(user, event) {
  const t = getTransporter();
  const fromAddr = process.env.SMTP_FROM || 'no-reply@events.local';
  const dateStr = new Date(event.event_date).toLocaleString('uk-UA');

  const info = await t.sendMail({
    from: `"Система реєстрації на заходи" <${fromAddr}>`,
    to: user.email,
    subject: `Підтвердження реєстрації: ${event.title}`,
    text:
      `Вітаємо, ${user.name}!\n\n` +
      `Ви успішно зареєструвались на захід:\n` +
      `  ${event.title}\n` +
      `  Дата: ${dateStr}\n` +
      `  Місце: ${event.location}\n\n` +
      `Опис заходу:\n${event.description}\n\n` +
      `Дякуємо, що користуєтесь нашою системою!`,
    html:
      `<h2>Вітаємо, ${escapeHtml(user.name)}!</h2>` +
      `<p>Ви успішно зареєструвались на захід:</p>` +
      `<ul>` +
      `<li><b>${escapeHtml(event.title)}</b></li>` +
      `<li>Дата: ${escapeHtml(dateStr)}</li>` +
      `<li>Місце: ${escapeHtml(event.location)}</li>` +
      `</ul>` +
      `<p>${escapeHtml(event.description)}</p>` +
      `<p>Дякуємо, що користуєтесь нашою системою!</p>`,
  });

  // У dev-режимі виводимо лист у консоль
  if (info && info.message) {
    console.log('\n--- EMAIL (dev) ---');
    console.log(info.message.toString());
    console.log('-------------------\n');
  }
  return info;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

module.exports = { sendRegistrationConfirmation };
