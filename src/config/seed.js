// src/config/seed.js
require('dotenv').config();
const { pool } = require('./db');
const bcrypt = require('bcrypt');

const sampleCategories = [
  { name: 'Salary', type: 'income', color: '#5eead4' },
  { name: 'Freelance', type: 'income', color: '#7dd3ae' },
  { name: 'Rent', type: 'expense', color: '#e8a33d' },
  { name: 'Groceries', type: 'expense', color: '#f4845f' },
  { name: 'Transport', type: 'expense', color: '#8b93a7' },
  { name: 'Entertainment', type: 'expense', color: '#a78bfa' },
  { name: 'Utilities', type: 'expense', color: '#60a5fa' }
];

async function seed() {
  try {
    console.log('🌱 Seeding demo user, categories, and transactions...');

    // Demo user (only created if it doesn't already exist)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', ['demo@example.com']);
    let userId;

    if (existing.length) {
      userId = existing[0].id;
      console.log('ℹ️  Demo user already exists, reusing it.');
    } else {
      const password_hash = await bcrypt.hash('demo1234', 10);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Demo User', 'demo@example.com', password_hash]
      );
      userId = result.insertId;
      console.log('✅ Created demo user (demo@example.com / demo1234)');
    }

    // Categories
    const categoryIds = {};
    for (const cat of sampleCategories) {
      const [result] = await pool.query(
        'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
        [userId, cat.name, cat.type, cat.color]
      );
      categoryIds[cat.name] = result.insertId;
    }

    // Transactions across the current month
    const transactions = [
      { category: 'Salary', amount: 850000, type: 'income', description: 'Monthly salary', day: 1 },
      { category: 'Freelance', amount: 120000, type: 'income', description: 'Side project payment', day: 5 },
      { category: 'Rent', amount: 200000, type: 'expense', description: 'Monthly rent', day: 2 },
      { category: 'Groceries', amount: 45000, type: 'expense', description: 'Weekly groceries', day: 4 },
      { category: 'Groceries', amount: 38000, type: 'expense', description: 'Weekly groceries', day: 11 },
      { category: 'Transport', amount: 25000, type: 'expense', description: 'Fuel + transport', day: 6 },
      { category: 'Entertainment', amount: 15000, type: 'expense', description: 'Movies + dinner', day: 9 },
      { category: 'Utilities', amount: 32000, type: 'expense', description: 'Electricity + water', day: 3 }
    ];

    const now = new Date();
    for (const t of transactions) {
      const date = new Date(now.getFullYear(), now.getMonth(), t.day).toISOString().slice(0, 10);
      await pool.query(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, categoryIds[t.category], t.amount, t.type, t.description, date]
      );
    }

    console.log(`✅ Seeded ${sampleCategories.length} categories and ${transactions.length} transactions.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();