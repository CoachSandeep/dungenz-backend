const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

// ✅ Get all workouts (for admin panel)
router.get('/', authenticate, checkRole('superadmin'), async (req, res) => {
  const workouts = await Workout.find().sort({ date: -1 });
  res.json(workouts);
});

// ✅ Edit workout
router.put('/:id/edit', authenticate, checkRole('superadmin'), async (req, res) => {
  const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// ✅ Delete workout
router.delete('/:id/delete', authenticate, checkRole('superadmin'), async (req, res) => {
  await Workout.findByIdAndDelete(req.params.id);
  res.json({ message: 'Workout deleted' });
});

// ✅ Copy workout
router.post('/:id/copy', authenticate, checkRole('superadmin'), async (req, res) => {
  const original = await Workout.findById(req.params.id);
  const copied = new Workout({
    ...original._doc,
    _id: mongoose.Types.ObjectId(),
    isNew: true,
    copiedFrom: original._id,
    createdBy: req.user._id,
    title: `${original.title} (Copy)`
  });
  await copied.save();
  res.json(copied);
});

// ✅ Star a workout
router.patch('/:id/star', authenticate, checkRole('superadmin'), async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  workout.isStarred = !workout.isStarred;
  await workout.save();
  res.json({ starred: workout.isStarred });
});

// ✅ Save to library
router.patch('/:id/library', authenticate, checkRole('superadmin'), async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  workout.isInLibrary = !workout.isInLibrary;
  await workout.save();
  res.json({ library: workout.isInLibrary });
});

module.exports = router;
