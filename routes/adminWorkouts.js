const express = require('express');
const mongoose = require('mongoose'); // ✅ ADD THIS LINE
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

// ✅ Copy workout (fixed with date cast)
router.post('/:id/copy', authenticate, checkRole('superadmin'), async (req, res) => {
  console.log("📌 Copy route hit");
  console.log("🧾 ID received:", req.params.id);

  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid workout ID' });
  }

  try {
    const { toVersion, targetDate } = req.body;

    const original = await Workout.findById(id);
    if (!original) return res.status(404).json({ message: 'Workout not found' });

    const { date, ...rest } = original._doc;
    const safeDate = targetDate ? new Date(targetDate) : new Date(date);

    if (isNaN(safeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid target date' });
    }

    const copied = new Workout({
      ...rest,
      version: toVersion,
      date: safeDate,
      _id: new mongoose.Types.ObjectId(),
      isNew: true,
      copiedFrom: original._id,
      createdBy: req.user._id,
      title: `${original.title} (Copy)`
    });

    await copied.save();
    res.json(copied);
  } catch (err) {
    console.error("❌ Workout copy failed:", err.message);
    res.status(500).json({ message: 'Copy failed', error: err.message });
  }
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

// ✅ Get all library workouts
router.get('/library', authenticate, checkRole('superadmin'), async (req, res) => {
  try {
    const workouts = await Workout.find({ isInLibrary: true }).sort({ updatedAt: -1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch library workouts' });
  }
});

router.put('/bulk-update', authenticate, checkRole('superadmin'), async (req, res) => {
  const { workouts } = req.body;

  try {
    const bulkOps = workouts.map((w) => ({
      updateOne: {
        filter: { _id: w._id },
        update: {
          $set: {
            title: w.title,
            customName: w.customName,
            description: w.description,
            instruction: w.instruction,
            capTime: w.capTime || '',
            order: w.order || 0,
          },
        },
      },
    }));

    await Workout.bulkWrite(bulkOps);
    res.json({ message: 'Cluster updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Bulk update failed' });
  }
});

router.post('/cluster-copy', authenticate, checkRole('superadmin'), async (req, res) => {
  const { date, fromVersion, toVersions } = req.body;

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 86400000); // +1 day

    const original = await Workout.find({
      version: fromVersion,
      date: { $gte: startDate, $lt: endDate },
    });

    const copies = [];

    for (let toVersion of toVersions) {
      for (let w of original) {
        const copy = new Workout({
          title: w.title,
          description: w.description,
          capTime: w.capTime,
          customName: w.customName,
          instructions: w.instructions,
          version: toVersion,
          date: new Date(date), // 👈 user-selected date from req.body
          createdBy: req.user._id,
          copiedFrom: w._id,
        });
        await copy.save();
        copies.push(copy);
      }
    }

    res.json({ message: 'Cluster copied', copies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Copy failed' });
  }
});


module.exports = router;
