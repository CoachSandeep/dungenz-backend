const mongoose = require('mongoose');

const movementVideoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('MovementVideo', movementVideoSchema);