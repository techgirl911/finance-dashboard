// src/models/transactionModel.js
const { pool } = require('../config/db');

async function findByUser(userId, { limit, month } = {}) {
  let sql = `
    SELECT transactions.*, categories.name AS category_name, categories.color AS category_color
    FROM transactions
    LEFT JOIN categories ON categories.id = transactions.category_id
    WHERE transactions.user_id = ?
  `;
  const params = [userId];

  if (month) {
    // month format: 'YYYY-MM'
    sql += ' AND DATE_FORMAT(transaction_date, "%Y-%m") = ?';
    params.push(month);
  }

  sql += ' ORDER BY transaction_date DESC, transactions.created_at DESC';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(Number(limit));
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ user_id, category_id, amount, type, description, transaction_date }) {
  const [result] = await pool.query(
    `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, category_id || null, amount, type, description || null, transaction_date]
  );
  return findById(result.insertId, user_id);
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

// Totals for a given month — the core "where does my money go" query
async function getSummary(userId, month) {
  const [rows] = await pool.query(
    `SELECT type, SUM(amount) AS total
     FROM transactions
     WHERE user_id = ? AND DATE_FORMAT(transaction_date, "%Y-%m") = ?
     GROUP BY type`,
    [userId, month]
  );

  const summary = { income: 0, expense: 0 };
  rows.forEach(r => { summary[r.type] = Number(r.total); });
  summary.net = summary.income - summary.expense;
  return summary;
}

// Spending broken down by category — feeds the pie/bar chart
async function getByCategory(userId, month) {
  const [rows] = await pool.query(
    `SELECT categories.id, categories.name, categories.color, SUM(transactions.amount) AS total
     FROM transactions
     JOIN categories ON categories.id = transactions.category_id
     WHERE transactions.user_id = ?
       AND transactions.type = 'expense'
       AND DATE_FORMAT(transactions.transaction_date, "%Y-%m") = ?
     GROUP BY categories.id, categories.name, categories.color
     ORDER BY total DESC`,
    [userId, month]
  );
  return rows;
}

async function countByUser(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM transactions WHERE user_id = ?',
    [userId]
  );
  return rows[0].count;
}

module.exports = { findByUser, findById, create, remove, getSummary, getByCategory, countByUser };