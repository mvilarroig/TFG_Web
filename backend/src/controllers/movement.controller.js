const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/movements
const getMovements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category_id, from, to, search, page = 1, limit = 20 } = req.query;
    console.log('[getMovements] query:', { type, category_id, from, to, search, page, limit });

    const conditions = ['m.user_id = $1'];
    const values     = [userId];
    let   idx        = 2;

    if (type)        { conditions.push(`m.type = $${idx++}`);          values.push(type); }
    if (category_id) { conditions.push(`m.category_id = $${idx++}`);   values.push(category_id); }
    if (from)        { conditions.push(`m.date >= $${idx++}`);          values.push(from); }
    if (to)          { conditions.push(`m.date <= $${idx++}`);          values.push(to + ' 23:59:59'); }
    if (search) {
      const si = idx++
      conditions.push(`(LOWER(m.description) LIKE $${si} OR LOWER(c.name) LIKE $${si})`)
      values.push(`%${search.toLowerCase()}%`)
    }

    const where  = conditions.join(' AND ');
    const offset = (Number(page) - 1) * Number(limit);

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT m.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
         FROM movements m
         LEFT JOIN categories c ON m.category_id = c.id
         WHERE ${where}
         ORDER BY m.date DESC, m.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM movements m LEFT JOIN categories c ON m.category_id = c.id WHERE ${where}`,
        values
      ),
    ]);

    res.json({
      data:       dataResult.rows,
      total:      Number(countResult.rows[0].count),
      page:       Number(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/movements/:id
const getMovementById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT m.*, c.name AS category_name
       FROM movements m LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = $1 AND m.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/movements
const createMovement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { type, amount, description, date, category_id } = req.body;

    const result = await pool.query(
      `INSERT INTO movements (user_id, type, amount, description, date, category_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, type, amount, description, date, category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/movements/:id
const updateMovement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { type, amount, description, date, category_id } = req.body;

    const result = await pool.query(
      `UPDATE movements
       SET type=$1, amount=$2, description=$3, date=$4, category_id=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [type, amount, description, date, category_id || null, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/movements/:id
const deleteMovement = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM movements WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json({ message: 'Movimiento eliminado', id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
};

// POST /api/movements/import
const importMovements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { movements } = req.body; // array of { type, amount, description, date, category_id? }

    if (!Array.isArray(movements) || movements.length === 0)
      return res.status(400).json({ error: 'No hay movimientos para importar' });

    if (movements.length > 500)
      return res.status(400).json({ error: 'Máximo 500 movimientos por importación' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let inserted = 0;
      for (const m of movements) {
        const { type, amount, description, date, category_id } = m;
        if (!['income','expense'].includes(type)) continue;
        if (!amount || isNaN(amount) || Number(amount) <= 0) continue;
        if (!date) continue;
        await client.query(
          `INSERT INTO movements (user_id, type, amount, description, date, category_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [userId, type, Number(amount), description || null, date, category_id || null]
        );
        inserted++;
      }
      await client.query('COMMIT');
      res.status(201).json({ message: `${inserted} movimientos importados`, inserted });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

module.exports = { getMovements, getMovementById, createMovement, updateMovement, deleteMovement, importMovements };