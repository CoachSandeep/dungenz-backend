const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  title: String,
  customName: String,
  summary: { type: String, default: '' },  // <-- 👈 ADD THIS LINE
  description: String,
  instructions: String,
  date: Date,
  capTime: String,
  icon: String,
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isInLibrary: {
    type: Boolean,
    default: false,
  },
  copiedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    default: null,
  },
  // New fields
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
 version: { type: String, enum: ['Ultra Train', 'Super Train', 'Minimal Equipment', 'Beginner'], required: true },
 
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
