const express = require('express');
const router = express.Router();
const DailyNote = require('../models/DailyNote');
const authMiddleware = require('../middleware/authMiddleware');

// Normalize date to remove time part
const normalizeDate = (dateStr) => {
  return new Date(new Date(dateStr).toISOString().split('T')[0]);
};

// 🟢 GET Note
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user, date } = req.query;
    if (!user || !date) return res.status(400).json({ message: 'user and date are required' });

    const normalizedDate = normalizeDate(date);
    const note = await DailyNote.findOne({ user, date: normalizedDate });
    res.status(200).json(note || null);
  } catch (err) {
    console.error('GET note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🟡 ADD or UPDATE Note
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { user, date, userNote, coachNote } = req.body;
    if (!user || !date) return res.status(400).json({ message: 'user and date are required' });

    const normalizedDate = normalizeDate(date);
    const update = {};

    // 🧍‍♂️ Only user can update userNote
    if (userNote !== undefined) {
      if (req.user._id.toString() !== user) {
        return res.status(403).json({ message: 'Unauthorized to update user note' });
      }
      update.userNote = userNote;
    }

    // 🧑‍🏫 Only coach/superadmin can update coachNote
    if (coachNote !== undefined) {
      if (!['coach', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized to update coach note' });
      }
      update.coachNote = coachNote;
    }

    const updated = await DailyNote.findOneAndUpdate(
      { user, date: normalizedDate },
      { $set: update },
      { upsert: true, new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error('POST note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔴 DELETE Note
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { user, date, type } = req.query;
    if (!user || !date || !type) return res.status(400).json({ message: 'user, date, and type are required' });

    const normalizedDate = normalizeDate(date);
    const note = await DailyNote.findOne({ user, date: normalizedDate });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // 🧍‍♂️ User can only delete their own userNote
    if (type === 'user') {
      if (req.user._id.toString() !== user) {
        return res.status(403).json({ message: 'Unauthorized to delete user note' });
      }
      note.userNote = '';
    }

    // 🧑‍🏫 Coach can only delete coachNote
    else if (type === 'coach') {
      if (!['coach', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized to delete coach note' });
      }
      note.coachNote = '';
    }

    await note.save();
    res.status(200).json({ message: 'Note deleted' });
  } catch (err) {
    console.error('DELETE note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
