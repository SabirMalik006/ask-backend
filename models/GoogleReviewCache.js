const mongoose = require('mongoose');

const googleReviewCacheSchema = new mongoose.Schema({
  authorName: {
    type: String,
    required: true
  },
  authorPhotoUrl: {
    type: String
  },
  rating: {
    type: Number,
    required: true
  },
  reviewText: {
    type: String
  },
  relativeTimeDescription: {
    type: String
  },
  googleReviewTime: {
    type: Number
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GoogleReviewCache', googleReviewCacheSchema);
