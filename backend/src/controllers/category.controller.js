const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/categories  → devuelve globales + propias del usuario
const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM categories WHERE user_id IS NULL OR user_id=$1 ORDER BY type, name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type, icon, color } = req.body;
    const result = await pool.query(
      `INSERT INTO categories (name, type, icon, color, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, type, icon, color, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    const result = await pool.query(
      `UPDATE categories SET name=$1,type=$2,icon=$3,color=$4 WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, type, icon, color, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM categories WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Categoría no encontrada o es global' });
    res.json({ message: 'Categoría eliminada' });
  } catch (err) { next(err); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };