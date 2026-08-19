// src/controllers/budgetController.js
const budgetModel = require('../models/budgetModel');

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getBudgets(req, res) {
  try {
    const budgets = await budgetModel.findByUser(req.user.id);
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budgets.', details: err.message });
  }
}

// Hard-gated: setting budgets is a full-license-only feature
async function setBudget(req, res) {
  try {
    const { category_id, monthly_limit } = req.body;

    if (!category_id || !monthly_limit) {
      return res.status(400).json({ error: 'category_id and monthly_limit are required.' });
    }

    const budget = await budgetModel.upsert({
      user_id: req.user.id,
      category_id,
      monthly_limit
    });

    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to set budget.', details: err.message });
  }
}

async function deleteBudget(req, res) {
  try {
    const deleted = await budgetModel.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Budget not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget.', details: err.message });
  }
}

async function getProgress(req, res) {
  try {
    const month = req.query.month || currentMonth();
    const progress = await budgetModel.getProgress(req.user.id, month);
    res.json({ progress, month });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budget progress.', details: err.message });
  }
}

module.exports = { getBudgets, setBudget, deleteBudget, getProgress };