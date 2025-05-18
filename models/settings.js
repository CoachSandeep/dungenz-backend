const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  releaseTime: {
    type: String, // ✅ change from Date to String
    required: true,
  },
});


module.exports = mongoose.model('Settings', settingsSchema);
