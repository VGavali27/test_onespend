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
  // Store in uploads/<folder>/ when the request sends a `folder` field (e.g. 'vendor'),
  // otherwise in the uploads root. The client must append `folder` before `file` in FormData.
  destination: (req, _file, cb) => {
    const folder = typeof req.body?.folder === 'string' && /^[a-z0-9_-]+$/i.test(req.body.folder) ? req.body.folder : '';
    const dir = folder ? path.join(uploadsDir, folder) : uploadsDir;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  // Expense attachments can be PDFs/invoices too — allow any file type.
});

const router = Router();
router.use(authMiddleware);

// Upload a file — returns { url: '/uploads/<folder>/<file>' } (folder = 'vendor', etc.)
router.post('/', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded');
    const sub = path.relative(uploadsDir, req.file.destination).split(path.sep).join('/');
    const url = sub ? `/uploads/${sub}/${req.file.filename}` : `/uploads/${req.file.filename}`;
    return ApiResponse.success(res, { url }, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
