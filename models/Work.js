const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'Portfolio',
      'Web Development',
      'App Development',
      'Digital Marketing',
      'Graphic Designing',
      'E-commerce',
      'UI/UX',
      'Video Editing'
    ],
    required: true
  },
  client: {
    type: String
  },
  services: {
    type: String
  },
  industries: {
    type: String
  },
  tags: [{
    type: String
  }],
  viewMoreLabel: {
    type: String
  },
  viewMoreUrl: {
    type: String
  },
  description: {
    type: String
  },
  heroImage: {
    type: String
  },
  galleryImages: [{
    type: String
  }],
  platforms: {
    type: String
  },
  contentStrategy: {
    type: String
  },
  serviceList: [{
    type: String
  }],
  // E-commerce specific fields
  businessSetup: {
    type: String
  },
  businessModels: {
    type: String
  },
  // Video Editing specific fields
  specialization: {
    type: String
  },
  /**
   * Mixed-media gallery support:
   * Used for categories that mix images and videos (e.g. E-commerce).
   * 
   * RENDERING FALLBACK LOGIC:
   * 1. If 'media' array exists and is not empty:
   *    - Iterate over the 'media' array in order.
   *    - For each item, check type ('image' or 'video').
   *    - Render 'video' elements with 'url' and 'poster' thumbnail.
   *    - Render 'image' elements normally using 'url'.
   * 2. If 'media' array is empty or undefined:
   *    - Fall back to the traditional rendering using 'heroImage' + 'galleryImages' strings array.
   */
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    poster: {
      type: String
    }
  }],
  isOtherCreatives: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Work', workSchema);
