const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getMonthlySummary, getYearlySummary } = require('../controllers/summary.controller');

router.use(authenticate);

// GET /api/summary/monthly?year=2024&month=5
router.get('/monthly', getMonthlySummary);

// GET /api/summary/yearly?year=2024
router.get('/yearly',  getYearlySummary);

module.exports = router;