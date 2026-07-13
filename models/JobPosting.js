const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Development', 'Design', 'Marketing', 'Customer Service', 'Operations', 'Finance', 'Management']
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  experienceLevel: {
    type: String,
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager']
  },
  minExperienceYears: Number,
  maxExperienceYears: Number,
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid']
  },
  city: String,
  salaryMin: Number,
  salaryMax: Number,
  salaryDisclosed: {
    type: Boolean,
    default: false
  },
  educationRequirement: String,
  skills: [String],
  numberOfOpenings: {
    type: Number,
    default: 1
  },
  applicationDeadline: Date,
  status: {
    type: String,
    enum: ['Open', 'Closed', 'On Hold'],
    default: 'Open'
  },
  applicationEmail: String
}, {
  timestamps: true
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);
