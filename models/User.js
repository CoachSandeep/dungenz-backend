const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['member', 'admin', 'superadmin'],
    default: 'member',
    bio: String,
  gender: String,
  age: Number,
  profileImage: String, // URL to image
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);