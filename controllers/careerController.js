const Career = require('../models/Career');

const getCareers = async (req, res) => {
  try {
    const { department, type } = req.query;
    let query = { isActive: true };
    
    if (department) {
      query.department = department;
    }
    
    if (type) {
      query.type = type;
    }
    
    const careers = await Career.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: careers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (career) {
      res.json({
        success: true,
        data: career
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Career not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createCareer = async (req, res) => {
  try {
    const career = await Career.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Career created successfully!',
      data: career
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (career) {
      res.json({
        success: true,
        data: career
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Career not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (career) {
      res.json({
        success: true,
        message: 'Career deleted successfully!'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Career not found'
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
  getCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer
};
