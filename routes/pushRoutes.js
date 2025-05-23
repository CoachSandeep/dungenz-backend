const express = require('express');
const pushController = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const router = express.Router();

router.post('/register-token', authMiddleware, pushController.saveToken);
router.get('/all-tokens', authMiddleware, checkRole('superadmin'), pushController.getAllTokens);
router.post('/send', authMiddleware, checkRole('superadmin'), pushController.sendPushToAll);

module.exports = router;