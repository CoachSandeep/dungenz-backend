const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  console.log("🔍 Received headers:", req.headers);
 // const token = req.headers.authorization?.split(' ')[1];

 const token = jwt.sign(
  { id: User._id },
  process.env.JWT_SECRET,          // ✅ Should use ENV value
  { expiresIn: '1d' }
);

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
