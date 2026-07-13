const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  company: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  reviewText: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },
  source: {
    type: String,
    enum: ['Admin', 'Public Submission'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
