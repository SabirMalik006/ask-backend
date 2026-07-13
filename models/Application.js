const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  resumeType: {
    type: String,
    enum: ['file', 'link'],
    required: true
  },
  resumeUrl: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String
  },
  status: {
    type: String,
    enum: ['New', 'Reviewed', 'Interviewing', 'Rejected', 'Hired'],
    default: 'New'
  }
}, {
  timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Application', applicationSchema);
