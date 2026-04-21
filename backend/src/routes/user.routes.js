const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { updateProfile, changePassword, deleteAccount } = require('../controllers/user.controller');

router.use(authenticate);

router.put('/profile',
  [body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail()],
  updateProfile
);

router.put('/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  changePassword
);

router.delete('/', deleteAccount);

module.exports = router;