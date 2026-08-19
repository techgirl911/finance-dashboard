// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());

// --- Static frontend (public/) ---
app.use(express.static('public'));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- 404 handler ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`💰 Finance Dashboard API running on http://localhost:${PORT}`);
  });
}

start();