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
  try {
    console.log("📬 /api/settings/update hit");
    console.log("📦 Body:", req.body);

    const { releaseTime } = req.body;
    if (!releaseTime) return res.status(400).json({ message: 'Missing releaseTime' });

    const settings = await Settings.findOneAndUpdate(
      {},
      { releaseTime },
      { new: true, upsert: true }
    );

    console.log("✅ Release time saved:", settings);
    res.json({ success: true, releaseTime });
  } catch (err) {
    console.error("❌ Error saving release time:", err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});
  router.post('/test', authenticate, checkRole('superadmin'), (req, res) => {
    console.log("🧪 /api/settings/test hit");
    console.log("🔑 Token user:", req.user?.name);
    console.log("📦 Request body:", req.body);
  
    res.json({ message: "Test route working fine", body: req.body });
  });

module.exports = router;
