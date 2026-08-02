import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../../middleware/auth.js';
import ApiResponse from '../../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

// Ensure the uploads directory exists at startup
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();
router.use(authMiddleware);

// Upload an image — returns { url: '/uploads/<file>' }
router.post('/', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded');
    return ApiResponse.success(res, { url: `/uploads/${req.file.filename}` }, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
