require('dotenv').config();
const pool = require('./db');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Usuarios ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(150) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ  DEFAULT NOW(),
        updated_at TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // Categorías ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id      SERIAL PRIMARY KEY,
        name    VARCHAR(100) NOT NULL,
        type    VARCHAR(10)  NOT NULL CHECK (type IN ('income','expense')),
        icon    VARCHAR(50),
        color   VARCHAR(7),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        -- user_id NULL = categorías globales por defecto
        UNIQUE(name, user_id)
      );
    `);

    // Movimientos ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS movements (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER      REFERENCES categories(id) ON DELETE SET NULL,
        type        VARCHAR(10)  NOT NULL CHECK (type IN ('income','expense')),
        amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        description TEXT,
        date        DATE         NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // Gastos fijos ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fixed_expenses (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id  INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
        name         VARCHAR(150)  NOT NULL,
        amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        day_of_month INTEGER       CHECK (day_of_month BETWEEN 1 AND 31),
        active       BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ   DEFAULT NOW()
      );
    `);

    // Reset de contraseña ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN     NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Huchas de ahorro ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name          VARCHAR(100)  NOT NULL,
        icon          VARCHAR(10)   NOT NULL DEFAULT '🎯',
        color         VARCHAR(20)   NOT NULL DEFAULT '#3b82f6',
        target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        saved_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ   DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   DEFAULT NOW()
      );
    `);

    // Índices ───────────────────────────────────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_movements_user    ON movements(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_movements_date    ON movements(date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_movements_type    ON movements(type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_user   ON categories(user_id);`);

    await client.query('COMMIT');
    console.log('✅ Tablas creadas correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la migración:', err);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();