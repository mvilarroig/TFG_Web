const express   = require('express');
const router    = express.Router();
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMovements,
  getMovementById,
  createMovement,
  updateMovement,
  deleteMovement,
  importMovements,
} = require('../controllers/movement.controller');

// Todas las rutas requieren autenticación
router.use(authenticate);

const movementValidations = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo debe ser income o expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('El importe debe ser mayor que 0'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('description').optional().trim(),
  body('category_id').optional().isInt(),
];

// GET /api/movements?type=&category_id=&from=&to=&page=&limit=
router.get('/',          getMovements);
router.get('/:id',       getMovementById);
router.post('/import',   importMovements);
router.post('/',         movementValidations, createMovement);
router.put('/:id',       movementValidations, updateMovement);
router.delete('/:id',    deleteMovement);

module.exports = router;