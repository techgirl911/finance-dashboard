// src/routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const {
  getBudgets,
  setBudget,
  deleteBudget,
  getProgress
} = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { checkLicense, requireLicense } = require('../middleware/license');

router.get('/', authenticate, getBudgets);
router.post('/', authenticate, checkLicense, requireLicense, setBudget); // hard-gated — full license only
router.delete('/:id', authenticate, deleteBudget);
router.get('/progress', authenticate, getProgress);

module.exports = router;