const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['web', 'app', 'marketing', 'graphic', 'ecommerce', 'uiux', 'video', 'others']
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String
  },
  thumbnail: {
    type: String
  },
  images: [{
    type: String
  }],
  videos: [{
    type: String
  }],
  technologies: [{
    type: String
  }],
  clientName: {
    type: String
  },
  projectUrl: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
