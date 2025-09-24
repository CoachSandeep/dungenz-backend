const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { sendWelcomeNotification } = require('../utils/notifications');
const crypto = require('crypto');

// Utility to generate tokens
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '2h' });
};

const generateRefreshToken = (userId) => {
  // Increased from 7d to 30d
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, role = 'member' } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });

    // await sendWelcomeNotification(newUser);

    const accessToken = generateAccessToken(newUser._id, newUser.role); // ✅ fixed
    const refreshToken = generateRefreshToken(newUser._id); // ✅ fixed;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: accessToken,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact admin.' });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      token: accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, bio:user.bio, profileImage: user.profileImage, isIndividualProgram:user.isIndividualProgram }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Refresh Route
exports.refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ token: newAccessToken });
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Create and hash reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // ✅ Prepare reset URL
    const resetUrl = `https://dungenz-frontend.onrender.com/reset-password/${resetToken}`;

    // ✅ HTML Email Template
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border-radius:8px;background:#f9f9f9">
        <h2 style="color:#ff2c2c;">DUNGENZ Password Reset</h2>
        <p>Hello ${user.name || ''},</p>
        <p>We received a request to reset your password.</p>
        <p>
          Click the button below to reset it. This link will expire in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;margin-top:20px;background:#ff2c2c;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Reset Password
        </a>
        <p style="margin-top:20px;color:#999;">If you didn’t request this, you can safely ignore this email.</p>
        <hr style="margin-top:30px;"/>
        <p style="font-size:12px;color:#bbb;">Powered by DUNGENZ</p>
      </div>
    `;

    // ✅ Send the HTML email
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html
    });

    res.json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
