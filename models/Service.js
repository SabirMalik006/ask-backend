const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
