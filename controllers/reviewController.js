const Review = require('../models/Review');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper to upload a buffer stream to Cloudinary
const streamUpload = (buffer, folderPath, filename) => {
  return new Promise((resolve, reject) => {
    const options = { 
      folder: folderPath || 'ask-website/reviews', 
      asset_folder: folderPath || 'ask-website/reviews',
      resource_type: 'auto',
      overwrite: true
    };
    if (filename) {
      options.public_id = filename;
    }
    const stream = cloudinary.uploader.upload_stream(
      options,
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

// Helper to extract public ID from a Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    const pathParts = afterUpload.split('/');
    
    // Shift version if it exists
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    
    // Join parts and remove extension
    const withExt = pathParts.join('/');
    const lastDotIndex = withExt.lastIndexOf('.');
    if (lastDotIndex === -1) return withExt;
    return withExt.substring(0, lastDotIndex);
  } catch (err) {
    console.error('Error parsing Cloudinary URL:', err);
    return null;
  }
};

// GET /api/reviews (Public: list Approved reviews only)
const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'Approved' }).sort({ submittedAt: -1, createdAt: -1 });
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/reviews/all (Admin: list all reviews, supports ?status=X filter)
const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/reviews (Public submission: forced 'Public Submission' and 'Pending')
const submitReview = async (req, res) => {
  try {
    const { clientName, company, rating, reviewText } = req.body;
    
    if (!clientName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Name, rating, and review text are required fields.'
      });
    }

    let photoUrl = '';
    // Handle photo file upload
    if (req.file) {
      const filename = `review_${Date.now()}`;
      const uploadResult = await streamUpload(req.file.buffer, 'ask-website/reviews', filename);
      photoUrl = uploadResult.secure_url;
    }

    const review = await Review.create({
      clientName,
      company,
      rating: parseInt(rating),
      reviewText,
      photo: photoUrl || undefined,
      source: 'Public Submission',
      status: 'Pending',
      submittedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will be visible once approved by admin.',
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/reviews/admin (Admin directly: forced 'Admin' and 'Approved')
const createReviewAdmin = async (req, res) => {
  try {
    const { clientName, company, rating, reviewText, isFeatured } = req.body;

    if (!clientName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Name, rating, and review text are required fields.'
      });
    }

    let photoUrl = '';
    // Handle photo file upload
    if (req.file) {
      const filename = `review_admin_${Date.now()}`;
      const uploadResult = await streamUpload(req.file.buffer, 'ask-website/reviews', filename);
      photoUrl = uploadResult.secure_url;
    }

    const review = await Review.create({
      clientName,
      company,
      rating: parseInt(rating),
      reviewText,
      photo: photoUrl || undefined,
      source: 'Admin',
      status: 'Approved',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      submittedAt: new Date(),
      reviewedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully!',
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/reviews/:id/status (Admin: Approve/Reject review)
const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected.'
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: `Review status updated to ${status}!`,
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/reviews/:id (Admin: Edit review content)
const updateReview = async (req, res) => {
  try {
    const id = req.params.id;
    let review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const { clientName, company, rating, reviewText, isFeatured, removePhoto } = req.body;
    const updateData = {};

    if (clientName) updateData.clientName = clientName;
    if (company !== undefined) updateData.company = company;
    if (rating) updateData.rating = parseInt(rating);
    if (reviewText) updateData.reviewText = reviewText;
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    // Handle photo removal
    if (removePhoto === 'true' || removePhoto === true) {
      if (review.photo) {
        const publicId = getPublicIdFromUrl(review.photo);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        updateData.photo = '';
      }
    }

    // Handle new photo upload
    if (req.file) {
      // Remove old photo if exists
      if (review.photo) {
        const publicId = getPublicIdFromUrl(review.photo);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      const filename = `review_edit_${Date.now()}`;
      const uploadResult = await streamUpload(req.file.buffer, 'ask-website/reviews', filename);
      updateData.photo = uploadResult.secure_url;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Review updated successfully!',
      data: updatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/reviews/:id (Admin: Delete review)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(id = req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Delete photo from Cloudinary if exists
    if (review.photo) {
      const publicId = getPublicIdFromUrl(review.photo);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Review.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Review deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getApprovedReviews,
  getAllReviews,
  submitReview,
  createReviewAdmin,
  updateReviewStatus,
  updateReview,
  deleteReview
};
