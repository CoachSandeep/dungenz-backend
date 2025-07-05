const PushToken = require('../models/PushToken');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const CommentDay = require('../models/CommentDay');
const User = require('../models/User');
const Notification = require('../models/Notification');
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

    const user = await User.findById(userId);

    const comment = {
      user: {
        _id: user._id.toString(),
        name: user.name,
        avatar: user.avatar,
      },
      text,
      likes: [],
      replies: [],
      createdAt: new Date(),
    };

    let doc = await CommentDay.findOne({ date });

    if (!doc) {
      doc = await CommentDay.create({
        date,
        comments: [comment],
      });
    } else {
      doc.comments.push(comment);
      await doc.save();
    }

    const allUsers = await User.find({ _id: { $ne: userId } });

    // 🗓️ Workout label
    const getWorkoutLabel = (dateStr) => {
      const today = new Date();
      const target = new Date(dateStr);

      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffInDays = Math.floor((target - today) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return "today's workout";
      if (diffInDays === 1) return "tomorrow's workout";
      if (diffInDays === -1) return "yesterday's workout";

      return `the ${target.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} workout`;
    };

    const workoutLabel = getWorkoutLabel(date);

    // 💾 Internal Notifications
    await Promise.all(
      allUsers.map(u =>
        Notification.create({
          user: u._id,
          title: `${user.name} commented on ${workoutLabel} 💬`,
          link: `/workouts?date=${date}`,
          type: 'comment',
          date: new Date(),
        })
      )
    );

    // 🔔 Push Notifications
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
    console.error("🔥 Comment POST error:", err);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});



// Like comment
// Like comment with notification
router.patch('/:date/:commentId/like', authMiddleware, async (req, res) => {
  const { date, commentId } = req.params;
  const likerId = req.user.id;

  try {
    const commentDoc = await CommentDay.findOne({ date });
    if (!commentDoc) return res.status(404).json({ message: "Comment day not found" });

    const comment = commentDoc.comments.find(c => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const alreadyLiked = comment.likes.some(l => l.userId === likerId);

    const liker = await User.findById(likerId);
    const commentOwnerId = comment.user?._id?.toString?.() || comment.user?.toString?.();

    if (alreadyLiked) {
      // Unlike
      comment.likes = comment.likes.filter(l => l.userId !== likerId);
    } else {
      // Like
      comment.likes.push({
        userId: likerId,
        name: liker.name,
        avatar: liker.avatar
      });

      // Send notification only if not self-like
      if (commentOwnerId && commentOwnerId !== likerId) {
        // Internal Notification
        await Notification.create({
          user: commentOwnerId,
          title: `${liker.name} liked your comment ❤️`,
          link: `/workouts?date=${date}`,
          type: 'like',
          date: new Date()
        });

        // Push Notification
        const tokens = await PushToken.find({ userId: commentOwnerId }).select('token -_id');
        const tokenList = tokens.map(t => t.token).filter(Boolean);

        if (tokenList.length > 0) {
          const messages = tokenList.map(token => ({
            token,
            notification: {
              title: '❤️ Someone liked your comment',
              body: `${liker.name} liked your comment on the workout`
            },
            data: {
              link: `/workouts?date=${date}`,
              type: 'like'
            }
          }));

          await admin.messaging().sendEach(messages);
        }
      }
    }

    await commentDoc.save();
    res.json({ liked: !alreadyLiked });
  } catch (err) {
    console.error('🔥 Error in liking comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
