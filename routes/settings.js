const express = require('express');
const mongoose = require('mongoose'); // ✅ ADD THIS LINE
const router = express.Router();
const Settings = require('../models/settings');
const authenticate = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');


// ✅ GET route: Accessible to ALL authenticated users (not just superadmin)
router.get('/', authenticate, async (req, res) => {
    const settings = await Settings.findOne() || await Settings.create({});
    res.json({ releaseTime: settings.releaseTime });
  });
  
// Update release time
router.put('/', authenticate, checkRole('superadmin'), async (req, res) => {
    const { releaseTime } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { releaseTime },  // ✅ just save string like "21:00"
      { new: true, upsert: true }
    );
    res.json(settings);
  });

module.exports = router;
