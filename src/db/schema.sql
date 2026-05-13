-- ============================================================
-- Система онлайн-реєстрації на заходи
-- Схема бази даних MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_registration
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE event_registration;

-- ------------------------------------------------------------
-- Таблиця користувачів
-- ------------------------------------------------------------
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30)  DEFAULT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Таблиця заходів
-- ------------------------------------------------------------
CREATE TABLE events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  event_date   DATETIME NOT NULL,
  location     VARCHAR(200) NOT NULL,
  category     VARCHAR(50)  NOT NULL DEFAULT 'general',
  image_url    VARCHAR(500) DEFAULT NULL,
  max_seats    INT NOT NULL DEFAULT 100,
  created_by   INT DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date),
  INDEX idx_events_category (category),
  CONSTRAINT fk_events_user FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Таблиця реєстрацій (зв'язок many-to-many)
-- ------------------------------------------------------------
CREATE TABLE registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  event_id      INT NOT NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_event (user_id, event_id),
  CONSTRAINT fk_reg_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
