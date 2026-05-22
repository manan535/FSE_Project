import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
  addReaction,
  uploadAttachments
} from '../controllers/messageController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

router.use(protect);
router.use(checkWorkspaceAccess);

router.post('/', sendMessage);
router.get('/:chatId', getMessages);
router.put('/read/:chatId', markAsRead);
router.put('/:id/edit', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', addReaction);
router.post('/upload', upload.array('files', 5), uploadAttachments);

export default router;
