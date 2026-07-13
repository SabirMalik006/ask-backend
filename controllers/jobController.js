const JobPosting = require('../models/JobPosting');

// GET /api/jobs (Public: list active jobs only, optional ?department=X)
const getActiveJobs = async (req, res) => {
  try {
    const { department } = req.query;
    const query = { isActive: true, status: 'Open' };
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    const jobs = await JobPosting.find(query).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/jobs/all (Admin only: list all jobs active and inactive)
const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({}).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/jobs/:id (Public: get a single job posting by ID)
const getJobById = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/jobs (Admin only: create a new job posting)
const createJob = async (req, res) => {
  try {
    const job = await JobPosting.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Job posting created successfully!',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/jobs/:id (Admin only: update an existing job posting)
const updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }
    res.json({
      success: true,
      message: 'Job posting updated successfully!',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/jobs/:id (Admin only: delete a job posting)
const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }
    res.json({
      success: true,
      message: 'Job posting deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getActiveJobs,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
