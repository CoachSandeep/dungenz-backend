const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/UserController');

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// ✅ Cloudinary Multer Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dungenz_profiles', // You can change folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional resizing
  },
});
const upload = multer({ storage });

router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, upload.single('profileImage'), userController.updateProfile);

// ✅ Admin-only routes
router.get('/', authMiddleware, userController.listUsers);
router.patch('/:id/role', authMiddleware, userController.updateUserRole);
router.patch('/:id/toggle-active', authMiddleware, userController.toggleUserActive);
router.patch('/:id/individual-program', authMiddleware, userController.toggleIndividualProgramming);
router.delete('/:id', authMiddleware, userController.deleteUser);


module.exports = router;
