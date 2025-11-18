// backend/middleware/uploadMiddleware.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const journalDir = path.join(uploadsDir, 'journal');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(journalDir)) {
  fs.mkdirSync(journalDir);
}

// Configure storage for baby profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: baby_timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'baby-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for journal photos
const journalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, journalDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: journal_timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'journal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer for baby profile images (single file)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for journal photos (multiple files, max 5)
const journalUpload = multer({
  storage: journalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Max 5 files
  },
  fileFilter: fileFilter
});

export default upload;

// Export journal photo upload middleware
export const uploadJournalPhotos = journalUpload.array('photos', 5);
