const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      bio: req.body.bio
    };

    // ✅ If file is uploaded, add profileImage path
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
      console.log("📸 Image Path Set:", updateData.profileImage);
    }

    // ✅ Perform update
    const updated = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};
