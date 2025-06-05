// controllers/commentController.js
const Comment = require('../models/CommentDay');

exports.getCommentsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const comments = await Comment.find({ date }).populate('user', 'name avatar');
    res.json(comments);
  } catch (err) {
    console.error('❌ Comment fetch error:', err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};
