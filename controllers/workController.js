const Work = require('../models/Work');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const mongoose = require('mongoose');
const { getProjectFolder } = require('../utils/cloudinaryFolder');

/**
 * Helper to upload a buffer stream to Cloudinary
 */
const streamUpload = (buffer, folderPath) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: folderPath || 'work_portfolio', 
        asset_folder: folderPath || 'work_portfolio',
        resource_type: 'auto' 
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

/**
 * Helper to extract public ID from a Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1];
    const pathParts = afterUpload.split('/');
    
    // Shift version if it exists (e.g., v1625626359/)
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    
    const fileWithExt = pathParts.join('/');
    const lastDotIndex = fileWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return fileWithExt.substring(0, lastDotIndex);
    }
    return fileWithExt;
  } catch (e) {
    console.error('Error parsing Cloudinary URL:', e);
    return null;
  }
};

/**
 * GET all work items, optional filter by category
 */
const getWorks = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    const works = await Work.find(query).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: works
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET a single work item by ID
 */
const getWorkById = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (work) {
      res.json({
        success: true,
        data: work
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * CREATE a new work item
 */
const createWork = async (req, res) => {
  try {
    const body = { ...req.body };
    
    // Parse tags if they are sent as a string/JSON
    if (body.tags) {
      if (typeof body.tags === 'string') {
        body.tags = body.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    } else {
      body.tags = [];
    }

    // Parse serviceList if sent as a string/JSON
    if (body.serviceList) {
      if (typeof body.serviceList === 'string') {
        body.serviceList = body.serviceList.split(',').map(t => t.trim()).filter(Boolean);
      }
    } else {
      body.serviceList = [];
    }

    // Pre-generate MongoDB _id to form unique project subfolder path
    const workId = new mongoose.Types.ObjectId();
    const folderPath = await getProjectFolder(body.category || 'Portfolio', body.client || body.title || 'untitled', workId);

    // Explicitly pre-create the nested folder visually in Cloudinary Media Library UI
    await cloudinary.api.create_folder(folderPath).catch(err => {
      console.warn(`Could not explicitly create Cloudinary folder "${folderPath}":`, err.message);
    });

    // Handle single file upload for heroImage
    if (req.files && req.files.heroImage && req.files.heroImage[0]) {
      const result = await streamUpload(req.files.heroImage[0].buffer, folderPath);
      body.heroImage = result.secure_url;
    } else if (body.heroImageUrl) {
      body.heroImage = body.heroImageUrl;
    }

    // Handle dynamic mixed-media array if mediaJSON is sent (E-commerce)
    if (body.mediaJSON) {
      const mediaLayout = JSON.parse(body.mediaJSON);
      const media = [];
      const galleryFiles = (req.files && req.files.galleryImages) ? req.files.galleryImages : [];

      for (const item of mediaLayout) {
        const mediaItem = { type: item.type };
        
        if (item.url) {
          mediaItem.url = item.url;
        } else if (item.fileIndex !== undefined && galleryFiles[item.fileIndex]) {
          const file = galleryFiles[item.fileIndex];
          const uploadResult = await streamUpload(file.buffer, folderPath);
          mediaItem.url = uploadResult.secure_url;
        } else {
          mediaItem.url = '';
        }
        
        if (item.type === 'video') {
          if (item.poster) {
            mediaItem.poster = item.poster;
          } else if (item.posterFileIndex !== undefined && galleryFiles[item.posterFileIndex]) {
            const file = galleryFiles[item.posterFileIndex];
            const uploadResult = await streamUpload(file.buffer, folderPath);
            mediaItem.poster = uploadResult.secure_url;
          } else {
            mediaItem.poster = '';
          }
        }
        
        media.push(mediaItem);
      }
      body.media = media;
      body.galleryImages = [];
    } else {
      // Handle multiple files upload for galleryImages
      const galleryUrls = [];
      if (body.galleryImages) {
        if (Array.isArray(body.galleryImages)) {
          galleryUrls.push(...body.galleryImages);
        } else {
          galleryUrls.push(body.galleryImages);
        }
      }
      if (req.files && req.files.galleryImages) {
        for (const file of req.files.galleryImages) {
          const result = await streamUpload(file.buffer, folderPath);
          galleryUrls.push(result.secure_url);
        }
      }
      body.galleryImages = galleryUrls;
    }
    body._id = workId;

    const work = await Work.create(body);
    res.status(201).json({
      success: true,
      message: 'Work item created successfully!',
      data: work
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE an existing work item
 */
const updateWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    const body = { ...req.body };

    // Parse tags if they are sent as a string
    if (body.tags !== undefined) {
      if (typeof body.tags === 'string') {
        body.tags = body.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // Parse serviceList if sent as a string
    if (body.serviceList !== undefined) {
      if (typeof body.serviceList === 'string') {
        body.serviceList = body.serviceList.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const folderPath = await getProjectFolder(
      body.category || work.category,
      body.client || body.title || work.client || work.title,
      work._id
    );

    // Explicitly pre-create the nested folder visually in Cloudinary Media Library UI
    await cloudinary.api.create_folder(folderPath).catch(err => {
      console.warn(`Could not explicitly create Cloudinary folder "${folderPath}":`, err.message);
    });

    // Handle heroImage upload/replacement
    if (req.files && req.files.heroImage && req.files.heroImage[0]) {
      // Delete old heroImage from Cloudinary if it exists
      if (work.heroImage) {
        const oldPublicId = getPublicIdFromUrl(work.heroImage);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(err => console.error('Cloudinary delete error:', err));
        }
      }
      const result = await streamUpload(req.files.heroImage[0].buffer, folderPath);
      body.heroImage = result.secure_url;
    } else if (body.heroImageUrl !== undefined) {
      if (body.heroImageUrl && work.heroImage && work.heroImage !== body.heroImageUrl) {
        const oldPublicId = getPublicIdFromUrl(work.heroImage);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(err => console.error('Cloudinary delete error:', err));
        }
      }
      body.heroImage = body.heroImageUrl || '';
    } else if (body.heroImage !== undefined && work.heroImage && work.heroImage !== body.heroImage) {
      // If heroImage URL changed manually/removed, delete old image
      const oldPublicId = getPublicIdFromUrl(work.heroImage);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId).catch(err => console.error('Cloudinary delete error:', err));
      }
    }

    // Handle dynamic mixed-media array if mediaJSON is sent (E-commerce)
    if (body.mediaJSON) {
      const mediaLayout = JSON.parse(body.mediaJSON);
      const media = [];
      const galleryFiles = (req.files && req.files.galleryImages) ? req.files.galleryImages : [];

      for (const item of mediaLayout) {
        const mediaItem = { type: item.type };
        
        if (item.url) {
          mediaItem.url = item.url;
        } else if (item.fileIndex !== undefined && galleryFiles[item.fileIndex]) {
          const file = galleryFiles[item.fileIndex];
          const uploadResult = await streamUpload(file.buffer, folderPath);
          mediaItem.url = uploadResult.secure_url;
        } else {
          mediaItem.url = '';
        }
        
        if (item.type === 'video') {
          if (item.poster) {
            mediaItem.poster = item.poster;
          } else if (item.posterFileIndex !== undefined && galleryFiles[item.posterFileIndex]) {
            const file = galleryFiles[item.posterFileIndex];
            const uploadResult = await streamUpload(file.buffer, folderPath);
            mediaItem.poster = uploadResult.secure_url;
          } else {
            mediaItem.poster = '';
          }
        }
        
        media.push(mediaItem);
      }

      // Delete any old Cloudinary assets no longer present in new media array
      const oldUrls = (work.media || []).map(m => m.url);
      const oldPosterUrls = (work.media || []).map(m => m.poster).filter(Boolean);
      const newUrls = media.map(m => m.url);
      const newPosterUrls = media.map(m => m.poster).filter(Boolean);

      const removedUrls = oldUrls.filter(url => !newUrls.includes(url)).concat(
        oldPosterUrls.filter(url => !newPosterUrls.includes(url))
      );

      for (const url of removedUrls) {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
        }
      }

      body.media = media;
      body.galleryImages = [];
    } else {
      // Handle galleryImages updates
      let finalGalleryUrls = [];
      if (body.galleryImages !== undefined) {
        if (Array.isArray(body.galleryImages)) {
          finalGalleryUrls = [...body.galleryImages];
        } else if (body.galleryImages) {
          finalGalleryUrls = [body.galleryImages];
        }
      } else {
        finalGalleryUrls = [...work.galleryImages];
      }

      // Find and delete any gallery images that were removed in the update
      const removedImages = work.galleryImages.filter(url => !finalGalleryUrls.includes(url));
      for (const imgUrl of removedImages) {
        const publicId = getPublicIdFromUrl(imgUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
        }
      }

      // Upload and append new gallery images
      if (req.files && req.files.galleryImages) {
        for (const file of req.files.galleryImages) {
          const result = await streamUpload(file.buffer, folderPath);
          finalGalleryUrls.push(result.secure_url);
        }
      }
      body.galleryImages = finalGalleryUrls;
    }

    // Apply updates
    Object.keys(body).forEach(key => {
      work[key] = body[key];
    });

    const updatedWork = await work.save();
    res.json({
      success: true,
      message: 'Work item updated successfully!',
      data: updatedWork
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE a work item and its Cloudinary assets
 */
const deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    // Delete heroImage from Cloudinary
    if (work.heroImage) {
      const publicId = getPublicIdFromUrl(work.heroImage);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
      }
    }

    // Delete all galleryImages from Cloudinary
    if (work.galleryImages && work.galleryImages.length > 0) {
      for (const imgUrl of work.galleryImages) {
        const publicId = getPublicIdFromUrl(imgUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
        }
      }
    }

    await Work.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Work item deleted successfully from DB and Cloudinary!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/work/:id/images - Add additional gallery images to an existing work item
 */
const addGalleryImages = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    const uploadedUrls = [];
    if (req.files && req.files.galleryImages) {
      for (const file of req.files.galleryImages) {
        const result = await streamUpload(file.buffer);
        uploadedUrls.push(result.secure_url);
      }
    }

    work.galleryImages.push(...uploadedUrls);
    await work.save();

    res.json({
      success: true,
      message: 'Gallery images added successfully!',
      data: work
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE /api/work/:id/images/:imageId - Remove a specific gallery image
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    const { imageId } = req.params;
    
    // Find the image URL that matches the imageId
    const targetUrl = work.galleryImages.find(url => {
      const pubId = getPublicIdFromUrl(url);
      return pubId === imageId || url.includes(imageId);
    });

    if (!targetUrl) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in gallery'
      });
    }

    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(targetUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
    }

    // Pull from array
    work.galleryImages = work.galleryImages.filter(url => url !== targetUrl);
    await work.save();

    res.json({
      success: true,
      message: 'Gallery image removed successfully!',
      data: work
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  addGalleryImages,
  deleteGalleryImage
};
