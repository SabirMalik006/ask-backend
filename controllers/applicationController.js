const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const Application = require('../models/Application');
const JobPosting = require('../models/JobPosting');
const sendEmail = require('../utils/sendEmail');

// Helper function to upload file buffer to Cloudinary
const streamUpload = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    // Determine a safe public_id or extension if possible, or just let Cloudinary auto-detect
    const stream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'auto',
        folder: 'resumes',
        public_id: filename ? filename.split('.')[0] + '_' + Date.now() : undefined
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// POST /api/applications (Public: Submit an application)
const submitApplication = async (req, res) => {
  try {
    const { jobId, name, email, phone, resumeType, coverLetter } = req.body;
    let { resumeUrl } = req.body;

    // Validate if the job posting exists
    const jobExists = await JobPosting.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({
        success: false,
        message: 'The selected job posting does not exist'
      });
    }

    if (!resumeType) {
      return res.status(400).json({
        success: false,
        message: 'resumeType is required'
      });
    }

    if (resumeType === 'file') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Resume file is required when resumeType is "file"'
        });
      }
      
      // Upload file to Cloudinary
      const uploadResult = await streamUpload(req.file.buffer, req.file.originalname);
      resumeUrl = uploadResult.secure_url;
    } else if (resumeType === 'link') {
      if (!resumeUrl || resumeUrl.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Resume link URL is required when resumeType is "link"'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid resumeType. Must be "file" or "link"'
      });
    }

    // Create the application record
    const application = await Application.create({
      jobId,
      name,
      email,
      phone,
      resumeType,
      resumeUrl,
      coverLetter
    });

    // Fire email notification asynchronously (non-blocking)
    JobPosting.findById(jobId).then(job => {
      if (job) {
        const emailContent = `
          <h2>New Job Application Received</h2>
          <p><strong>Job Title:</strong> ${job.title}</p>
          <p><strong>Department:</strong> ${job.department}</p>
          <p><strong>Applicant Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Resume:</strong> <a href="${resumeUrl}" target="_blank">${resumeType === 'file' ? 'View Uploaded Resume File' : 'View Applicant Resume Link'}</a></p>
          <p><strong>Cover Letter / Message:</strong></p>
          <p>${coverLetter ? coverLetter.replace(/\n/g, '<br>') : 'No cover letter provided.'}</p>
        `;
        
        sendEmail({
          to: 'careers@askwebsolutions.com',
          subject: `New Application: ${name} - ${job.title}`,
          html: emailContent
        });
      }
    }).catch(err => {
      console.error('Failed to trigger application email notification:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: application
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/applications (Admin only: List applications, support optional ?jobId=X)
const getApplications = async (req, res) => {
  try {
    const { jobId } = req.query;
    const query = {};

    if (jobId) {
      query.jobId = jobId;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'title department location type')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/applications/:id/status (Admin only: Update status)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['New', 'Reviewed', 'Interviewing', 'Rejected', 'Hired'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('jobId', 'title department');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully!',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/applications/:id (Admin only: Delete application)
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  updateApplicationStatus,
  deleteApplication
};
