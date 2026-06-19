const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
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

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await streamUpload(req.file.buffer);

    res.json({
      success: true,
      message: 'File uploaded successfully!',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadFile
};
