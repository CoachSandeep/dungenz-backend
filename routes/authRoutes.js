const express = require('express');
const { register, login, refreshToken, sendResetLink, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refreshToken);
router.post('/forgot-password', sendResetLink);
router.post('/reset-password', resetPassword);


module.exports = router;
