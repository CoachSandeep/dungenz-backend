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
  
// ✅ Only superadmin can update
router.post('/update', authenticate, checkRole('superadmin'), async (req, res) => {
    const { releaseTime } = req.body;
  
    if (!releaseTime || typeof releaseTime !== 'string') {
      return res.status(400).json({ error: 'Invalid release time' });
    }
  
    const settings = await Settings.findOneAndUpdate(
      {},
      { releaseTime }, // ✅ save as plain "HH:mm"
      { new: true, upsert: true }
    );
  
    res.json(settings);
  });

  router.post('/test', authenticate, checkRole('superadmin'), (req, res) => {
    console.log("🧪 /api/settings/test hit");
    console.log("🔑 Token user:", req.user?.name);
    console.log("📦 Request body:", req.body);
  
    res.json({ message: "Test route working fine", body: req.body });
  });

module.exports = router;
