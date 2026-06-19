const Review = require('../models/Review');

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isActive: true }).sort({ createdAt: -1 });
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

const createReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
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

const updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (review) {
      res.json({
        success: true,
        data: review
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      res.json({
        success: true,
        message: 'Review deleted successfully!'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview
};
