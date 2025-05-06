const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  title: String,
  customName: String,
  description: String,
  instructions: String,
  date: Date,
  capTime: String,
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
 version: { type: String, enum: ['Ultra Train', 'Super Train', 'Minimal Equipment', 'Beginner'], required: true },
 
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
