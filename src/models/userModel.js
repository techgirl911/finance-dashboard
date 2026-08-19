// src/models/userModel.js
const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, license_key, created_at FROM users WHERE id = ?',
    [id]
  ); // excludes password_hash on purpose
  return rows[0] || null;
}

async function create({ name, email, password_hash }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, password_hash]
  );
  return findById(result.insertId);
}

async function setLicenseKey(userId, licenseKey) {
  await pool.query('UPDATE users SET license_key = ? WHERE id = ?', [licenseKey, userId]);
  return findById(userId);
}

module.exports = { findByEmail, findById, create, setLicenseKey };