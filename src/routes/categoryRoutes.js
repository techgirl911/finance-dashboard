// src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { checkLicense } = require('../middleware/license');

router.get('/', authenticate, getCategories);
router.post('/', authenticate, checkLicense, createCategory);
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;