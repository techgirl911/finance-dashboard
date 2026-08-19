// src/models/budgetModel.js
const { pool } = require('../config/db');

async function findByUser(userId) {
  const [rows] = await pool.query(
    `SELECT budgets.*, categories.name AS category_name, categories.color AS category_color
     FROM budgets
     JOIN categories ON categories.id = budgets.category_id
     WHERE budgets.user_id = ?`,
    [userId]
  );
  return rows;
}

// Creates or updates the budget for a category (one budget per category per user)
async function upsert({ user_id, category_id, monthly_limit }) {
  await pool.query(
    `INSERT INTO budgets (user_id, category_id, monthly_limit)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
    [user_id, category_id, monthly_limit]
  );
  const [rows] = await pool.query(
    'SELECT * FROM budgets WHERE user_id = ? AND category_id = ?',
    [user_id, category_id]
  );
  return rows[0];
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

// Compares each budget against actual spend for a given month
async function getProgress(userId, month) {
  const [rows] = await pool.query(
    `SELECT
       budgets.id, budgets.monthly_limit,
       categories.id AS category_id, categories.name AS category_name, categories.color,
       COALESCE(SUM(CASE
         WHEN DATE_FORMAT(transactions.transaction_date, "%Y-%m") = ?
         THEN transactions.amount ELSE 0 END), 0) AS spent
     FROM budgets
     JOIN categories ON categories.id = budgets.category_id
     LEFT JOIN transactions ON transactions.category_id = categories.id AND transactions.user_id = budgets.user_id
     WHERE budgets.user_id = ?
     GROUP BY budgets.id, budgets.monthly_limit, categories.id, categories.name, categories.color`,
    [month, userId]
  );
  return rows;
}

module.exports = { findByUser, upsert, remove, getProgress };