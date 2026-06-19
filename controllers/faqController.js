const FAQ = require('../models/FAQ');

const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully!',
      data: faq
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (faq) {
      res.json({
        success: true,
        data: faq
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (faq) {
      res.json({
        success: true,
        message: 'FAQ deleted successfully!'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'FAQ not found'
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
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
};
