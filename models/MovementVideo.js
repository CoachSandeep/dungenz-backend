const mongoose = require('mongoose');

const movementVideoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  url: { type: String, default: '' }, // Can be empty for placeholder
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MovementVideo', movementVideoSchema);