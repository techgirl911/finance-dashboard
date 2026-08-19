// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, me, activate } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/activate', authenticate, activate);

module.exports = router;