const express = require('express');
const router = express.Router();
const CommentDay = require('../models/CommentDay');


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
  const { userId } = req.body;
  const { date, commentId } = req.params;

  console.log("🧠 PATCH LIKE →", { date, commentId, userId });

  await CommentDay.updateOne(
    { date, "comments._id": commentId },
    { $addToSet: { "comments.$.likes": userId } }
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

module.exports = router;
