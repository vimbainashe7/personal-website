const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const courseId = req.params.id || req.body.course_id || 'general';
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', String(courseId));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|ppt|pptx|txt|md|jpg|jpeg|png|webp|gif)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, MD, and images are permitted.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: fileFilter
});

module.exports = upload;
