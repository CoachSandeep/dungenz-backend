const express = require('express');
const router = express.Router();
const MovementVideo = require('../models/MovementVideo');

// ✅ GET: All movement videos
router.get('/', async (req, res) => {
  try {
    const videos = await MovementVideo.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// ✅ POST: Add new movement or update existing if placeholder
router.post('/', async (req, res) => {
  const { name, youtubeUrl } = req.body; // ✅ match frontend naming
  if (!name) return res.status(400).json({ error: 'Movement name is required' });

  try {
    const existing = await MovementVideo.findOne({ name });

    if (existing) {
      if (!existing.url && youtubeUrl) {
        existing.url = youtubeUrl;
        await existing.save();
        return res.json({ updated: true, video: existing });
      }
      return res.json({ exists: true, video: existing });
    }

    const newVideo = new MovementVideo({ name, url: youtubeUrl });
    await newVideo.save();
    res.status(201).json({ created: true, video: newVideo });

  } catch (err) {
    res.status(500).json({ error: 'Failed to save movement video' });
  }
});

// ✅ SEARCH: movement autocomplete
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: "Query param 'q' is required" });

  try {
    const results = await MovementVideo.find({
      name: { $regex: query, $options: 'i' }
    }).select('name url'); // include `url` now for frontend reference
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
