const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fe.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM fixed_expenses fe
       LEFT JOIN categories c ON fe.category_id = c.id
       WHERE fe.user_id = $1
       ORDER BY fe.active DESC, fe.amount DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, amount, category_id, day_of_month } = req.body;
    const result = await pool.query(
      `INSERT INTO fixed_expenses (user_id, name, amount, category_id, day_of_month)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name, Number(amount), category_id || null, day_of_month || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, amount, category_id, day_of_month, active } = req.body;
    const result = await pool.query(
      `UPDATE fixed_expenses
       SET name=$1, amount=$2, category_id=$3, day_of_month=$4, active=$5
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, Number(amount), category_id || null, day_of_month || null, active !== false, id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM fixed_expenses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
