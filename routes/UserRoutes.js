const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/UserController');
const multer = require('multer');

// ✅ Image upload setup with safe filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/[^a-z0-9.\-_]/g, ''); // Remove special characters except dot, dash, underscore

    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage });

router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, upload.single('profileImage'), userController.updateProfile);
// Add this to routes/user.js
router.get('/', authMiddleware, userController.listUsers);

module.exports = router;
