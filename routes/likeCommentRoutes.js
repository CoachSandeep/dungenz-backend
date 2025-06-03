const express = require('express');
const Workout = require('../models/Workout');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Toggle Like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    const userId = req.user._id;

    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const liked = workout.likes.includes(userId);
    if (liked) {
      workout.likes.pull(userId);
    } else {
      workout.likes.push(userId);
    }
    await workout.save();
    res.json({ likes: workout.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: 'Like error', error: err.message });
  }
});

// Add Comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    workout.comments.push({ user: req.user._id, text });
    await workout.save();
    res.json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: 'Comment error', error: err.message });
  }
});

// Get Comments
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id).populate('comments.user', 'name');
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    res.json(workout.comments);
  } catch (err) {
    res.status(500).json({ message: 'Fetch error', error: err.message });
  }
});

module.exports = router;