const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, updated_at=NOW() WHERE id=$3
       RETURNING id, name, email, created_at`,
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query('SELECT password FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, req.user.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) { next(err); }
};

const deleteAccount = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.user.id]);
    res.json({ message: 'Cuenta eliminada' });
  } catch (err) { next(err); }
};

module.exports = { updateProfile, changePassword, deleteAccount };