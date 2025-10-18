const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${safeOriginal}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    // images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // videos
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Unsupported file type'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// Single file upload
// @route POST /api/uploads
// field name: file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = path.join(uploadsDir, req.file.filename);

    // If Cloudinary configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const resource_type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type,
        folder: 'fitmaker'
      });

      // remove local temp file
      fs.unlink(filePath, () => {});
      return res.status(201).json({ url: result.secure_url, public_id: result.public_id, provider: 'cloudinary' });
    }

    // Fallback: serve from local disk
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({ url: publicUrl, filename: req.file.filename, provider: 'local' });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;


