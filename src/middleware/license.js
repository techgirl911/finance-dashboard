// src/middleware/license.js
const { pool } = require('../config/db');

// Limits applied when a user has no license_key (demo mode)
const DEMO_LIMITS = {
  maxTransactionsVisible: 15,
  maxCategories: 4,
  canSetBudgets: false
};

async function checkLicense(req, res, next) {
  if (!req.user) {
    req.hasLicense = false;
    return next();
  }

  try {
    const [rows] = await pool.query(
      'SELECT license_key FROM users WHERE id = ?',
      [req.user.id]
    );
    req.hasLicense = Boolean(rows[0]?.license_key);
    next();
  } catch (err) {
    next(err);
  }
}

function requireLicense(req, res, next) {
  if (!req.hasLicense) {
    return res.status(403).json({
      error: 'This feature requires a full license.',
      upgradeUrl: process.env.UPGRADE_URL || 'https://your-store-link.example.com'
    });
  }
  next();
}

module.exports = { checkLicense, requireLicense, DEMO_LIMITS };