// src/controllers/categoryController.js
const categoryModel = require('../models/categoryModel');
const { DEMO_LIMITS } = require('../middleware/license');

async function getCategories(req, res) {
  try {
    const categories = await categoryModel.findByUser(req.user.id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.', details: err.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, type, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required.' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be "income" or "expense".' });
    }

    if (!req.hasLicense) {
      const count = await categoryModel.countByUser(req.user.id);
      if (count >= DEMO_LIMITS.maxCategories) {
        return res.status(403).json({
          error: `Demo mode allows up to ${DEMO_LIMITS.maxCategories} categories. Upgrade for unlimited.`,
          upgradeUrl: process.env.UPGRADE_URL || 'https://your-store-link.example.com'
        });
      }
    }

    const category = await categoryModel.create({ user_id: req.user.id, name, type, color });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.', details: err.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const deleted = await categoryModel.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.', details: err.message });
  }
}

module.exports = { getCategories, createCategory, deleteCategory };