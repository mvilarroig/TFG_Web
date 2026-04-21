const pool = require('../config/db');

// GET /api/savings-goals
const getAll = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id=$1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/savings-goals
const create = async (req, res, next) => {
  try {
    const { name, icon, color, target_amount } = req.body;
    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, name, icon, color, target_amount)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, name, icon || '🎯', color || '#3b82f6', target_amount || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/savings-goals/:id  (editar meta)
const update = async (req, res, next) => {
  try {
    const { name, icon, color, target_amount } = req.body;
    const result = await pool.query(
      `UPDATE savings_goals SET name=$1, icon=$2, color=$3, target_amount=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, icon, color, target_amount, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// PATCH /api/savings-goals/:id/deposit  (aportar o retirar)
const deposit = async (req, res, next) => {
  try {
    const { amount } = req.body; // positivo = aportar, negativo = retirar
    const result = await pool.query(
      `UPDATE savings_goals
       SET saved_amount = GREATEST(0, saved_amount + $1), updated_at=NOW()
       WHERE id=$2 AND user_id=$3 RETURNING *`,
      [amount, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/savings-goals/:id
const remove = async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM savings_goals WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Hucha eliminada', id: result.rows[0].id });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, deposit, remove };
