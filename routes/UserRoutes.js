const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/UserController');
const multer = require('multer');

// Image upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, upload.single('profileImage'), userController.updateProfile);

module.exports = router;
