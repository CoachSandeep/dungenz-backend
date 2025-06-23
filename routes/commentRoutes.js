const express = require('express');
const router = express.Router();
const CommentDay = require('../models/CommentDay');
const jwt = require('jsonwebtoken');


// Get all comments for a date
router.get('/:date', async (req, res) => {
  const date = req.params.date;
  const doc = await CommentDay.findOne({ date });
  res.json(doc?.comments || []);
});

// Add new comment
router.post('/:date', async (req, res) => {
  const { text, user } = req.body;
  const date = req.params.date;
  const comment = { user, text, likes: [], replies: [] };

  const doc = await CommentDay.findOneAndUpdate(
    { date },
    { $push: { comments: comment } },
    { upsert: true, new: true }
  );

  res.json(doc.comments);
});

// Like comment
router.patch('/:date/:commentId/like', async (req, res) => {
  const { userId, name, avatar } = req.body;
  const { date, commentId } = req.params;

  console.log("🧠 PATCH LIKE →", { date, commentId, userId, name });

  await CommentDay.updateOne(
    { date, "comments._id": commentId },
    {
      $addToSet: {
        "comments.$.likes": {
          _id: userId,
          name
        }
      }
    }
  );

  res.json({ liked: true });
});


// Reply to a comment
router.post('/:date/:commentId/reply', async (req, res) => {
  const { text, user } = req.body;
  const { date, commentId } = req.params;
  const reply = { user, text, likes: [] };

  await CommentDay.updateOne(
    { date, "comments._id": commentId },
    { $push: { "comments.$.replies": reply } }
  );
  res.json({ replied: true });
});



// Delete a comment by its ID from a specific date
router.delete('/:date/:commentId', async (req, res) => {
  const { date, commentId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const doc = await CommentDay.findOne({ date });
    if (!doc) return res.status(404).json({ message: 'CommentDay not found' });

    const commentToDelete = doc.comments.find(c => c._id.toString() === commentId);

    // ⚠️ Check permission
    const isOwner = commentToDelete?.user?._id === userId;
    const isSuperAdmin = decoded.role === 'superadmin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden: Only owner or superadmin can delete' });
    }

    // Delete
    doc.comments = doc.comments.filter(c => c._id.toString() !== commentId);
    await doc.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
