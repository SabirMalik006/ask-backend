const Project = require('../models/Project');

const getProjects = async (req, res) => {
  try {
    const { category, isFeatured } = req.query;
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (isFeatured) {
      query.isFeatured = isFeatured === 'true';
    }
    
    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isActive: true });
    if (project) {
      res.json({
        success: true,
        data: project
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (project) {
      res.json({
        success: true,
        data: project
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (project) {
      res.json({
        success: true,
        message: 'Project deleted successfully!'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Project not found'
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
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject
};
