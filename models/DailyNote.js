const mongoose = require('mongoose');

const DailyNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    unique: true, // 1 entry per date
  },
  userNote: {
    type: String,
    default: '',
  },
  coachNote: {
    type: String,
    default: '',
  },
}, {
  timestamps: true
});

// DailyNoteSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyNote', DailyNoteSchema);
