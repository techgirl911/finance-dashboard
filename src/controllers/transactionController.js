// src/controllers/transactionController.js
const transactionModel = require('../models/transactionModel');
const { DEMO_LIMITS } = require('../middleware/license');

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getTransactions(req, res) {
  try {
    const month = req.query.month || currentMonth();
    let transactions = await transactionModel.findByUser(req.user.id, { month });

    if (!req.hasLicense && transactions.length > DEMO_LIMITS.maxTransactionsVisible) {
      transactions = transactions.slice(0, DEMO_LIMITS.maxTransactionsVisible);
    }

    res.json({ transactions, demoMode: !req.hasLicense, month });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.', details: err.message });
  }
}

async function createTransaction(req, res) {
  try {
    const { category_id, amount, type, description, transaction_date } = req.body;

    if (!amount || !type || !transaction_date) {
      return res.status(400).json({ error: 'amount, type, and transaction_date are required.' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be "income" or "expense".' });
    }

    const transaction = await transactionModel.create({
      user_id: req.user.id,
      category_id,
      amount,
      type,
      description,
      transaction_date
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction.', details: err.message });
  }
}

async function deleteTransaction(req, res) {
  try {
    const deleted = await transactionModel.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction.', details: err.message });
  }
}

async function getSummary(req, res) {
  try {
    const month = req.query.month || currentMonth();
    const summary = await transactionModel.getSummary(req.user.id, month);
    res.json({ ...summary, month });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary.', details: err.message });
  }
}

async function getByCategory(req, res) {
  try {
    const month = req.query.month || currentMonth();
    const breakdown = await transactionModel.getByCategory(req.user.id, month);
    res.json({ breakdown, month });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category breakdown.', details: err.message });
  }
}

module.exports = { getTransactions, createTransaction, deleteTransaction, getSummary, getByCategory };