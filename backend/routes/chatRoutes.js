import express from 'express';
import {
  createDirectChat,
  createGroupChat,
  createGroupChatFromProject,
  getWorkspaceChats,
  pinChat,
  updateGroupChat
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(checkWorkspaceAccess);

router.post('/direct', createDirectChat);
router.post('/group', createGroupChat);
router.post('/group/project', createGroupChatFromProject);
router.get('/', getWorkspaceChats);
router.put('/:id/pin', pinChat);
router.put('/:id', updateGroupChat);

export default router;
