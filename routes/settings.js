const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');
const { authenticate } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');


// Get settings
router.get('/', authenticate, checkRole('superadmin'), async (req, res) => {
  const settings = await Settings.findOne() || await Settings.create({});
  res.json({ releaseTime: settings.releaseTime });
});

// Update release time
router.put('/', authenticate, checkRole('superadmin'), async (req, res) => {
  const { releaseTime } = req.body;
  const settings = await Settings.findOneAndUpdate(
    {},
    { releaseTime: new Date(releaseTime) },
    { new: true, upsert: true }
  );
  res.json(settings);
});

module.exports = router;
