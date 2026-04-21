const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { getAll, create, update, remove } = require('../controllers/fixedExpense.controller');

router.use(authenticate);

const validations = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('amount').isFloat({ gt: 0 }).withMessage('El importe debe ser mayor que 0'),
  body('category_id').optional({ nullable: true }).isInt(),
  body('day_of_month').optional({ nullable: true }).isInt({ min: 1, max: 31 }),
];

router.get('/',     getAll);
router.post('/',    validations, create);
router.put('/:id',  validations, update);
router.delete('/:id', remove);

module.exports = router;
