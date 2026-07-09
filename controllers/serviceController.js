const Service = require('../models/Service');

/**
 * GET all services ordered by display order
 */
const getServices = async (req, res) => {
  try {
    const services = await Service.find({}).sort({ order: 1 });
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

/**
 * CREATE a new service
 */
const createService = async (req, res) => {
  try {
    const { title, description, tags, order } = req.body;
    
    const newService = await Service.create({
      title,
      description,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      order: order || 0
    });
    
    res.status(201).json({
      success: true,
      data: newService
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE an existing service
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, order } = req.body;
    
    let service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    service.title = title !== undefined ? title : service.title;
    service.description = description !== undefined ? description : service.description;
    if (tags !== undefined) {
      service.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    }
    service.order = order !== undefined ? order : service.order;
    
    await service.save();
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE a service
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    await Service.deleteOne({ _id: id });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
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
