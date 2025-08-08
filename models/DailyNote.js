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
  timestamps: true,
});

// Enforce one note per user per date
DailyNoteSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyNote', DailyNoteSchema);
