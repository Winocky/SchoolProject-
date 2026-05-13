'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'event_registration';

  console.log(`> Підключення до MySQL: ${user}@${host}:${port}`);
  const conn = await mysql.createConnection({
    host, port, user, password, multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('> Виконую schema.sql...');
  await conn.query(schema);

  await conn.changeUser({ database: dbName });

  console.log('> Заповнюю тестові дані...');

  // Адміністратор
  const adminPassword = await bcrypt.hash('admin123', 10);
  await conn.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')`,
    ['Адміністратор', 'admin@example.com', adminPassword],
  );

  // Звичайний користувач
  const userPassword = await bcrypt.hash('user1234', 10);
  await conn.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, 'user')`,
    ['Святослав', 'user@example.com', userPassword],
  );

  // Заходи
  const events = [
    {
      title: 'Лекція: Основи штучного інтелекту',
      description:
        'Знайомство з принципами роботи нейронних мереж та сучасними застосуваннями ШІ. Лекцію проведе викладач з університету.',
      event_date: futureDate(7, 14, 0),
      location: 'Аудиторія №205, корпус А',
      category: 'lecture',
      max_seats: 80,
    },
    {
      title: 'Тренінг "Як виступати публічно"',
      description:
        'Практичний тренінг з ораторської майстерності. Учасники навчаться долати страх сцени, будувати структуру виступу та працювати з аудиторією.',
      event_date: futureDate(10, 11, 30),
      location: 'Конференц-зал, 3 поверх',
      category: 'training',
      max_seats: 30,
    },
    {
      title: 'Семінар "Кар\'єра в ІТ"',
      description:
        'Зустріч із представниками провідних ІТ-компаній. Обговорення вакансій, стажувань та шляху від студента до senior-розробника.',
      event_date: futureDate(14, 16, 0),
      location: 'Актова зала',
      category: 'seminar',
      max_seats: 150,
    },
    {
      title: 'Воркшоп з веб-розробки',
      description:
        'Створимо першу веб-сторінку на HTML, CSS та JavaScript. Підходить для початківців. Принесіть ноутбук.',
      event_date: futureDate(21, 10, 0),
      location: 'Комп\'ютерний клас №312',
      category: 'workshop',
      max_seats: 25,
    },
    {
      title: 'Благодійний концерт "Підтримка"',
      description:
        'Виступ шкільних колективів та запрошених артистів. Всі зібрані кошти підуть на підтримку дитячого будинку.',
      event_date: futureDate(28, 18, 0),
      location: 'Актова зала',
      category: 'concert',
      max_seats: 200,
    },
  ];

  for (const ev of events) {
    await conn.query(
      `INSERT INTO events (title, description, event_date, location, category, max_seats, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [ev.title, ev.description, ev.event_date, ev.location, ev.category, ev.max_seats],
    );
  }

  console.log('> Готово!');
  console.log('  Адмін:        admin@example.com / admin123');
  console.log('  Користувач:   user@example.com  / user1234');

  await conn.end();
}

function futureDate(daysAhead, hours, minutes) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

main().catch((err) => {
  console.error('Помилка ініціалізації БД:', err);
  process.exit(1);
});
