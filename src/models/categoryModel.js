// src/models/categoryModel.js
const { pool } = require('../config/db');

async function findByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
    [userId]
  );
  return rows;
}

async function findById(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ user_id, name, type, color }) {
  const [result] = await pool.query(
    'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
    [user_id, name, type, color || '#5eead4']
  );
  return findById(result.insertId, user_id);
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function countByUser(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM categories WHERE user_id = ?',
    [userId]
  );
  return rows[0].count;
}

module.exports = { findByUser, findById, create, remove, countByUser };