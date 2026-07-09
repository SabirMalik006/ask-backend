const TeamMember = require('../models/TeamMember');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const { slugify } = require('../utils/cloudinaryFolder');

// Helper to upload a buffer stream to Cloudinary
const streamUpload = (buffer, folderPath, filename) => {
  return new Promise((resolve, reject) => {
    const options = { 
      folder: folderPath || 'ask-website/team', 
      asset_folder: folderPath || 'ask-website/team',
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

// Helper to download an image from a URL to a buffer
const downloadImageToBuffer = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image from URL: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Extract profile image URL from LinkedIn public profile
 */
const fetchLinkedinPhoto = async (req, res) => {
  try {
    const { profileUrl } = req.query;
    if (!profileUrl) {
      return res.status(400).json({ success: false, message: 'profileUrl query parameter is required' });
    }
    
    if (!profileUrl.includes('linkedin.com/')) {
      return res.status(400).json({ success: false, message: 'Invalid LinkedIn URL' });
    }

    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ 
        success: false, 
        message: `Failed to fetch LinkedIn profile: HTTP status ${response.status}` 
      });
    }

    const html = await response.text();
    
    // Attempt multiple regexes for og:image content
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || 
                         html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i) ||
                         html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      const photoUrl = ogImageMatch[1].replace(/&amp;/g, '&');
      return res.json({ success: true, photoUrl });
    }
    
    return res.status(404).json({ 
      success: false, 
      message: 'Could not extract profile image. The profile may be private or requires login.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET all team members ordered by display order
 */
const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({}).sort({ order: 1 });
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * CREATE a new team member
 */
const createTeamMember = async (req, res) => {
  try {
    const { name, position, linkedinUrl, githubUrl, otherUrl, photoUrl, order } = req.body;
    const memberSlug = slugify(name);
    
    let finalPhotoUrl = null;
    
    // Check if photo file is uploaded
    if (req.files && req.files.photo && req.files.photo[0]) {
      const file = req.files.photo[0];
      const folder = `ask-website/team/${memberSlug}`;
      const cleanOriginalName = slugify(file.originalname.split('.')[0]);
      
      const uploadResult = await streamUpload(file.buffer, folder, cleanOriginalName);
      finalPhotoUrl = uploadResult.secure_url;
    } else if (photoUrl) {
      // Download and upload to Cloudinary
      try {
        const buffer = await downloadImageToBuffer(photoUrl);
        const folder = `ask-website/team/${memberSlug}`;
        const uploadResult = await streamUpload(buffer, folder, `${memberSlug}-imported`);
        finalPhotoUrl = uploadResult.secure_url;
      } catch (err) {
        console.error('Failed to upload imported photo:', err.message);
        finalPhotoUrl = photoUrl;
      }
    }
    
    const newMember = await TeamMember.create({
      name,
      position,
      photo: finalPhotoUrl,
      linkedinUrl,
      githubUrl,
      otherUrl,
      order: order || 0
    });
    
    res.status(201).json({
      success: true,
      data: newMember
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE a team member
 */
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, linkedinUrl, githubUrl, otherUrl, photoUrl, order, removePhoto } = req.body;
    
    let member = await TeamMember.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    const memberSlug = slugify(name || member.name);
    let finalPhotoUrl = member.photo;
    
    // Check if a new photo is uploaded
    if (req.files && req.files.photo && req.files.photo[0]) {
      // Delete old photo first (if exists and is not default)
      if (member.photo && member.photo.includes('res.cloudinary.com')) {
        const oldPublicId = getPublicIdFromUrl(member.photo);
        if (oldPublicId && !oldPublicId.includes('ask-website/team/_defaults/')) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (err) {
            console.error(`Failed to delete old photo: ${oldPublicId}`, err.message);
          }
        }
      }
      
      const file = req.files.photo[0];
      const folder = `ask-website/team/${memberSlug}`;
      const cleanOriginalName = slugify(file.originalname.split('.')[0]);
      
      const uploadResult = await streamUpload(file.buffer, folder, cleanOriginalName);
      finalPhotoUrl = uploadResult.secure_url;
    } else if (photoUrl) {
      // Re-upload if URL is new
      if (member.photo !== photoUrl) {
        if (member.photo && member.photo.includes('res.cloudinary.com')) {
          const oldPublicId = getPublicIdFromUrl(member.photo);
          if (oldPublicId && !oldPublicId.includes('ask-website/team/_defaults/')) {
            try {
              await cloudinary.uploader.destroy(oldPublicId);
            } catch (err) {
              console.error(`Failed to delete old photo: ${oldPublicId}`, err.message);
            }
          }
        }
        
        try {
          const buffer = await downloadImageToBuffer(photoUrl);
          const folder = `ask-website/team/${memberSlug}`;
          const uploadResult = await streamUpload(buffer, folder, `${memberSlug}-imported`);
          finalPhotoUrl = uploadResult.secure_url;
        } catch (err) {
          console.error('Failed to upload imported photo:', err.message);
          finalPhotoUrl = photoUrl;
        }
      }
    } else if (removePhoto === 'true' || removePhoto === true) {
      // User explicitly wants to remove the photo
      if (member.photo && member.photo.includes('res.cloudinary.com')) {
        const oldPublicId = getPublicIdFromUrl(member.photo);
        if (oldPublicId && !oldPublicId.includes('ask-website/team/_defaults/')) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (err) {
            console.error(`Failed to delete photo: ${oldPublicId}`, err.message);
          }
        }
      }
      finalPhotoUrl = null;
    }
    
    member.name = name || member.name;
    member.position = position || member.position;
    member.photo = finalPhotoUrl;
    member.linkedinUrl = linkedinUrl !== undefined ? linkedinUrl : member.linkedinUrl;
    member.githubUrl = githubUrl !== undefined ? githubUrl : member.githubUrl;
    member.otherUrl = otherUrl !== undefined ? otherUrl : member.otherUrl;
    member.order = order !== undefined ? order : member.order;
    
    await member.save();
    
    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE a team member
 */
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    // Delete photo from Cloudinary if exists and is not default
    if (member.photo && member.photo.includes('res.cloudinary.com')) {
      const oldPublicId = getPublicIdFromUrl(member.photo);
      if (oldPublicId && !oldPublicId.includes('ask-website/team/_defaults/')) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error(`Failed to delete photo on deletion: ${oldPublicId}`, err.message);
        }
      }
    }
    
    await TeamMember.deleteOne({ _id: id });
    
    res.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  fetchLinkedinPhoto
};
