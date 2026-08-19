// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getSummary,
  getByCategory
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { checkLicense } = require('../middleware/license');

router.get('/', authenticate, checkLicense, getTransactions);
router.post('/', authenticate, createTransaction);
router.delete('/:id', authenticate, deleteTransaction);
router.get('/summary', authenticate, getSummary);
router.get('/by-category', authenticate, getByCategory);

module.exports = router;