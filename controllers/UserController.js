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

exports.listUsers = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find({}, '_id name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};


// Change role of a user
exports.updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Role updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role', error: err.message });
  }
};

// Toggle user active/inactive
exports.toggleUserActive = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User is now ${user.isActive ? 'active' : 'inactive'}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling user', error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};