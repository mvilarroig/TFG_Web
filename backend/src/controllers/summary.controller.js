const pool = require('../config/db');

// GET /api/summary/monthly?year=2024&month=5
const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = Number(req.query.year  || now.getFullYear());
    const month  = Number(req.query.month || now.getMonth() + 1);

    // Totales generales
    const totals = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
       FROM movements
       WHERE user_id=$1
         AND EXTRACT(YEAR  FROM date)=$2
         AND EXTRACT(MONTH FROM date)=$3
       GROUP BY type`,
      [userId, year, month]
    );

    const income  = Number(totals.rows.find(r => r.type === 'income')?.total  || 0);
    const expense = Number(totals.rows.find(r => r.type === 'expense')?.total || 0);
    const balance = income - expense;

    // Saldo acumulado de todos los meses anteriores (carry-over)
    const carryOverResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS carry_over
       FROM movements
       WHERE user_id=$1
         AND date < $2::date`,
      [userId, `${year}-${String(month).padStart(2,'0')}-01`]
    );
    const carryOver = Number(carryOverResult.rows[0]?.carry_over || 0);

    // Desglose por categoría
    const byCategory = await pool.query(
      `SELECT c.name, c.icon, c.color, m.type,
              COALESCE(SUM(m.amount), 0) AS total,
              COUNT(*) AS count
       FROM movements m
       LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.user_id=$1
         AND EXTRACT(YEAR  FROM m.date)=$2
         AND EXTRACT(MONTH FROM m.date)=$3
       GROUP BY c.name, c.icon, c.color, m.type
       ORDER BY total DESC`,
      [userId, year, month]
    );

    // Movimientos día a día (para gráfico de línea)
    const daily = await pool.query(
      `SELECT date, type, COALESCE(SUM(amount), 0) AS total
       FROM movements
       WHERE user_id=$1
         AND EXTRACT(YEAR  FROM date)=$2
         AND EXTRACT(MONTH FROM date)=$3
       GROUP BY date, type
       ORDER BY date`,
      [userId, year, month]
    );

    res.json({ year, month, income, expense, balance, carryOver, totalBalance: carryOver + balance, byCategory: byCategory.rows, daily: daily.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/summary/yearly?year=2024
const getYearlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const year   = Number(req.query.year || new Date().getFullYear());

    const result = await pool.query(
      `SELECT EXTRACT(MONTH FROM date)::int AS month, type,
              COALESCE(SUM(amount), 0) AS total
       FROM movements
       WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2
       GROUP BY month, type
       ORDER BY month`,
      [userId, year]
    );

    res.json({ year, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMonthlySummary, getYearlySummary };