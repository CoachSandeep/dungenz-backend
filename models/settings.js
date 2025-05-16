const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  releaseTime: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(5, 0, 0, 0);
      return d;
    }
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
