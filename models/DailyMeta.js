const mongoose = require('mongoose');

const DailyMetaSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true, // 1 entry per date
  },
  calories: {
    type: String, // 👈 changed from Number to String
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyMeta', DailyMetaSchema);
