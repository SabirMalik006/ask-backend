const Service = require('../models/Service');

const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Service created successfully!',
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (service) {
      res.json({
        success: true,
        data: service
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (service) {
      res.json({
        success: true,
        message: 'Service deleted successfully!'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Service not found'
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
  getServices,
  createService,
  updateService,
  deleteService
};
