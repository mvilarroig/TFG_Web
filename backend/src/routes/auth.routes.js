const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const registerValidations = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const loginValidations = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register',        registerValidations, register);
router.post('/login',           loginValidations,    login);
router.get('/me',               authenticate,        getMe);
router.post('/forgot-password', body('email').isEmail().normalizeEmail(), forgotPassword);
router.post('/reset-password',  [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], resetPassword);

module.exports = router;
