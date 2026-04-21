const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getAll, create, update, deposit, remove } = require('../controllers/savingsGoal.controller');

router.use(authenticate);

router.get('/',                getAll);
router.post('/',               create);
router.put('/:id',             update);
router.patch('/:id/deposit',   deposit);
router.delete('/:id',          remove);

module.exports = router;
