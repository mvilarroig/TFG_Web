require('dotenv').config();
const pool = require('./db');

// Categorías globales por defecto (user_id = NULL)
const defaultCategories = [
  // Gastos
  { name: 'Alimentación',   type: 'expense', icon: '🛒', color: '#ef4444' },
  { name: 'Restaurantes',   type: 'expense', icon: '🍽️', color: '#f97316' },
  { name: 'Transporte',     type: 'expense', icon: '🚗', color: '#f59e0b' },
  { name: 'Vivienda',       type: 'expense', icon: '🏠', color: '#eab308' },
  { name: 'Salud',          type: 'expense', icon: '🏥', color: '#84cc16' },
  { name: 'Ocio',           type: 'expense', icon: '🎬', color: '#06b6d4' },
  { name: 'Ropa',           type: 'expense', icon: '👕', color: '#8b5cf6' },
  { name: 'Educación',      type: 'expense', icon: '📚', color: '#ec4899' },
  { name: 'Deporte',        type: 'expense', icon: '🏋️', color: '#10b981' },
  { name: 'Viajes',         type: 'expense', icon: '✈️', color: '#3b82f6' },
  { name: 'Suscripciones',  type: 'expense', icon: '📱', color: '#a855f7' },
  { name: 'Mascotas',       type: 'expense', icon: '🐾', color: '#78716c' },
  { name: 'Otros gastos',   type: 'expense', icon: '💸', color: '#6b7280' },
  // Ingresos
  { name: 'Salario',           type: 'income',  icon: '💼', color: '#22c55e' },
  { name: 'Freelance',         type: 'income',  icon: '💻', color: '#10b981' },
  { name: 'Inversiones',       type: 'income',  icon: '📈', color: '#14b8a6' },
  { name: 'Alquiler',          type: 'income',  icon: '🏘️', color: '#f59e0b' },
  { name: 'Dividendos',        type: 'income',  icon: '💹', color: '#06b6d4' },
  { name: 'Venta de artículos',type: 'income',  icon: '📦', color: '#a855f7' },
  { name: 'Beca',              type: 'income',  icon: '🎓', color: '#ec4899' },
  { name: 'Premio',            type: 'income',  icon: '🏆', color: '#eab308' },
  { name: 'Otros ingresos',    type: 'income',  icon: '💰', color: '#3b82f6' },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    for (const cat of defaultCategories) {
      await client.query(
        `INSERT INTO categories (name, type, icon, color, user_id)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, NULL
         WHERE NOT EXISTS (
           SELECT 1 FROM categories WHERE name = $1::varchar AND user_id IS NULL
         )`,
        [cat.name, cat.type, cat.icon, cat.color]
      );
    }
    console.log('✅ Categorías por defecto insertadas');
  } catch (err) {
    console.error('❌ Error en el seed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();