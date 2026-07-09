const mongoose = require('mongoose');

const DEFAULT_AVATAR = 'https://res.cloudinary.com/yu7gjemi/image/upload/ask-website/team/_defaults/default-avatar';

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null,
    get: function(v) {
      return v || DEFAULT_AVATAR;
    }
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    trim: true
  },
  otherUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);
