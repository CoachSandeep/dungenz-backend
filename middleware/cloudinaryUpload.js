const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dungenz_uploads', // ✅ your folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const upload = multer({ storage });

module.exports = upload;
