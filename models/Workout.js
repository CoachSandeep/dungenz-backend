const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  version: { type: String, enum: ['Ultra Train', 'Super Train', 'Minimal Equipment', 'Beginner'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
