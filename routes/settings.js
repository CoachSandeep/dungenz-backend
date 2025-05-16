const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');
const { verifyAdmin } = require('../middleware/auth');

// Get settings
router.get('/', verifyAdmin, async (req, res) => {
  const settings = await Settings.findOne() || await Settings.create({});
  res.json({ releaseTime: settings.releaseTime });
});

// Update release time
router.put('/', verifyAdmin, async (req, res) => {
  const { releaseTime } = req.body;
  const settings = await Settings.findOneAndUpdate(
    {},
    { releaseTime: new Date(releaseTime) },
    { new: true, upsert: true }
  );
  res.json(settings);
});

module.exports = router;
