const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

router.use(authenticate);

const catValidations = [
  body('name').trim().notEmpty(),
  body('type').isIn(['income', 'expense']),
  body('icon').optional().trim(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
];

router.get('/',     getCategories);
router.post('/',    catValidations, createCategory);
router.put('/:id',  catValidations, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;