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
import { checkChatAccess } from '../middlewares/planGate.js';

const router = express.Router();

router.use(protect);
router.use(checkWorkspaceAccess);
router.use(checkChatAccess); // Block all chat endpoints for free plan

router.post('/direct', createDirectChat);
router.post('/group', createGroupChat);
router.post('/group/project', createGroupChatFromProject);
router.get('/', getWorkspaceChats);
router.put('/:id/pin', pinChat);
router.put('/:id', updateGroupChat);

export default router;
