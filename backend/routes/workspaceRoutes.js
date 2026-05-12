import express from 'express';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  switchWorkspace,
  joinWorkspace,
  updateWorkspace,
  getWorkspaceMembers,
  removeMember
} from '../controllers/workspaceController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/my', protect, getMyWorkspaces);
router.get('/:id', protect, getWorkspace);
router.post('/switch', protect, switchWorkspace);
router.post('/join', protect, joinWorkspace);
router.put('/:id', protect, updateWorkspace);
router.get('/:id/members', protect, getWorkspaceMembers);
router.delete('/members/:memberId', protect, removeMember);

export default router;