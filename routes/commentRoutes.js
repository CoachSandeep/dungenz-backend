const PushToken = require('../models/PushToken');
const admin = require('firebase-admin');
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
router.post('/:date', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;
    const { date } = req.params;

    const comment = await Comment.create({
      user: userId,
      text,
      date,
      createdAt: new Date(),
    });

    const user = await User.findById(userId);
    const allUsers = await User.find({ _id: { $ne: userId } });

    // 🔁 Helper to format label like "today's workout"
    const getWorkoutLabel = (dateStr) => {
      const today = new Date();
      const target = new Date(dateStr);

      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffInDays = Math.floor((target - today) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return "Today's workout";
      if (diffInDays === 1) return "Tomorrow's workout";
      if (diffInDays === -1) return "Yesterday's workout";

      return `the ${target.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} workout`;
    };

    const workoutLabel = getWorkoutLabel(date);

    // 💾 Save internal notifications
    await Promise.all(
      allUsers.map(u =>
        PushToken.create({
          user: u._id,
          title: `${user.name} commented on ${workoutLabel} 💬`,
          link: `/workouts?date=${date}`,
          type: 'comment',
          date: new Date(),
        })
      )
    );

    // 🔔 Send Push Notifications
    const rawTokens = await PushToken.find({ userId: { $in: allUsers.map(u => u._id) } }).select('token -_id');
    const tokenList = [...new Set(rawTokens.map(t => t.token).filter(Boolean))];

    if (tokenList.length > 0) {
      const messages = tokenList.map(token => ({
        token,
        notification: {
          title: `New comment by ${user.name}`,
          body: `Check ${workoutLabel} 💬`
        },
        data: {
          link: `/workouts?date=${date}`,
          type: 'comment'
        }
      }));

      const response = await admin.messaging().sendEach(messages);
      console.log("🔔 Comment Push: Success:", response.successCount, " Failed:", response.failureCount);
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// Like comment
router.patch('/:date/:commentId/like', async (req, res) => {
  const { userId, name, avatar } = req.body;
  const { date, commentId } = req.params;

  const commentDoc = await CommentDay.findOne({ date });
  if (!commentDoc) return res.status(404).json({ message: "Comment day not found" });

  const comment = commentDoc.comments.find(c => c._id.toString() === commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const isLiked = comment.likes.some(l => l.userId === userId);

  // Update likes array manually
  if (isLiked) {
    comment.likes = comment.likes.filter(l => l.userId !== userId); // Unlike
  } else {
    comment.likes.push({ userId, name, avatar }); // Like
  }

  await commentDoc.save();
  res.json({ liked: !isLiked });
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
