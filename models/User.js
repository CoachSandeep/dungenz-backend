const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: {
    type: String,
    enum: ['member', 'admin', 'superadmin'],
    default: 'member'
  },
  isIndividualProgram: {
    type: Boolean,
    default: false
  },
  
  bio: { type: String, default: '' },
  gender: { type: String },
  age: { type: Number },
  profileImage: String,
  resetPasswordToken: String,
resetPasswordExpire: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
