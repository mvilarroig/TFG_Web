require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const movementRoutes = require('./routes/movement.routes');
const categoryRoutes = require('./routes/category.routes');
const summaryRoutes       = require('./routes/summary.routes');
const fixedExpenseRoutes  = require('./routes/fixedExpense.routes');
const savingsGoalRoutes   = require('./routes/savingsGoal.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Middlewares globales ─────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/movements',  movementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/summary',         summaryRoutes);
app.use('/api/fixed-expenses',  fixedExpenseRoutes);
app.use('/api/savings-goals',   savingsGoalRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Manejo de errores ────────────────────────────────────────────────────────
app.use(errorHandler);

// Arranque ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});