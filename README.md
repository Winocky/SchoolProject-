# Система онлайн-реєстрації на заходи

Шкільний проєкт з інформатики (11 клас). Веб-додаток для реєстрації користувачів на заходи (лекції, тренінги, семінари тощо) з адміністративною панеллю та email-підтвердженнями.

## Стек технологій

- **Backend:** Node.js + Express
- **База даних:** MySQL (через `mysql2/promise`)
- **Шаблонізація:** EJS
- **Аутентифікація:** `bcrypt` для хешування паролів + `express-session`
- **Email:** `nodemailer` (можна налаштувати на будь-який SMTP або використовувати dev-режим)
- **Frontend:** чистий HTML / CSS / JavaScript (без фреймворків)

## Структура проєкту

```
SchoolProject/
├── public/                  # Статичні файли
│   ├── css/style.css        # Стилі (адаптивні)
│   └── js/main.js           # Клієнтська валідація
├── src/
│   ├── app.js               # Точка входу Express
│   ├── db.js                # Пул з'єднань MySQL
│   ├── mailer.js            # Відправка email через nodemailer
│   ├── db/schema.sql        # SQL-схема бази даних
│   ├── middleware/auth.js   # requireLogin, requireAdmin
│   ├── routes/
│   │   ├── index.js         # Головна (список заходів + фільтри)
│   │   ├── auth.js          # /register, /login, /logout
│   │   ├── events.js        # Деталі, реєстрація, скасування
│   │   └── admin.js         # Адмін-панель (CRUD заходів)
│   └── scripts/init-db.js   # Створення БД + тестові дані
├── views/
│   ├── partials/            # header, footer
│   ├── admin/               # Шаблони адмін-панелі
│   ├── home.ejs             # Список заходів
│   ├── event.ejs            # Деталі заходу
│   ├── register.ejs / login.ejs
│   ├── my-registrations.ejs
│   └── error.ejs
├── package.json
├── .env.example
└── README.md
```

## Встановлення та запуск

### 1. Передумови

Потрібно встановити:

- **Node.js 18+** — https://nodejs.org/
- **MySQL 8+** — https://dev.mysql.com/downloads/installer/ (для Windows зручно через MySQL Installer або XAMPP)

Перевірити версії:

```bash
node --version
npm --version
mysql --version
```

### 2. Клонувати репозиторій та встановити залежності

```bash
git clone <repo-url> SchoolProject
cd SchoolProject
npm install
```

### 3. Налаштувати MySQL

**Варіант А (рекомендовано) — Docker:**

Якщо у вас встановлено Docker Desktop, MySQL запускається однією командою:

```bash
docker compose up -d
```

Це створить контейнер `school-event-mysql` з базою `event_registration`,
користувачем `root` та паролем `school123` (вже прописані у `docker-compose.yml`
та `.env`).

Перевірити статус:

```bash
docker ps
```

Зупинити: `docker compose down`. Видалити дані: `docker compose down -v`.

**Варіант Б — встановлений MySQL:**

Запустіть MySQL-сервер. Створіть користувача або використовуйте `root`.

Скопіюйте `.env.example` у `.env`:

```bash
cp .env.example .env
```

Відредагуйте `.env` під свій MySQL:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=event_registration
SESSION_SECRET=будь-який-довгий-рядок
```

### 4. Ініціалізувати базу даних

Скрипт створить базу, таблиці та заповнить їх тестовими даними:

```bash
npm run db:init
```

Після успішного виконання у консолі з'явиться:

```
> Готово!
  Адмін:        admin@example.com / admin123
  Користувач:   user@example.com  / user1234
```

### 5. Запустити сервер

```bash
npm start
```

Або в режимі розробки з автоперезапуском:

```bash
npm run dev
```

Відкрийте у браузері: **http://localhost:3000**

## Тестові акаунти

| Роль          | Email                | Пароль    |
|---------------|----------------------|-----------|
| Адміністратор | admin@example.com    | admin123  |
| Користувач    | user@example.com     | user1234  |

## Налаштування email (необов'язково)

За замовчуванням всі листи виводяться у консоль сервера (dev-режим — листи у форматі JSON у логах).

Щоб увімкнути реальну відправку, заповніть SMTP-параметри в `.env`. Приклад для Gmail:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ваш-email@gmail.com
SMTP_PASS=apppassword16chars
SMTP_FROM="Реєстрація <ваш-email@gmail.com>"
```

> **Важливо для Gmail:** потрібен **App Password**, а не звичайний пароль.
> Створити: https://myaccount.google.com/apppasswords

Підходять також безкоштовні тестові SMTP: Mailtrap, Ethereal, Brevo.

## Основний функціонал

### Для користувачів

- **Реєстрація / вхід** з валідацією email та складності паролю
- **Перегляд заходів** з фільтрами:
  - пошук за назвою/описом
  - фільтрація за категорією
  - фільтрація за датою (з/по)
- **Деталі заходу** з кнопкою "Зареєструватися"
- **Email-підтвердження** після успішної реєстрації
- **Сторінка "Мої реєстрації"** з можливістю скасувати
- Перевірка переповнення місць

### Для адміністратора

- Окрема **адмін-панель** зі статистикою (кількість заходів, користувачів, реєстрацій)
- **CRUD заходів**: створення, редагування, видалення
- **Список зареєстрованих** на кожен захід
- **Список всіх користувачів**

## Безпека

- Паролі хешуються через `bcrypt` (cost factor 10)
- Сесії підписані секретом з `.env`
- Перевірка прав доступу через middleware `requireLogin` / `requireAdmin`
- SQL-параметризовані запити (захист від SQL-ін'єкцій)
- HTML escape в EJS за замовчуванням (`<%= %>`) — захист від XSS

## Деплой (приклад для Heroku)

```bash
heroku create event-reg-school
heroku addons:create jawsdb:kitefin  # MySQL
heroku config:set SESSION_SECRET="$(openssl rand -hex 32)"
git push heroku main
heroku run npm run db:init
heroku open
```

Альтернативи: Render, Railway, DigitalOcean App Platform, VPS з PM2 + nginx.

## Ліцензія

Навчальний проєкт. Використовуйте вільно для освітніх цілей.
