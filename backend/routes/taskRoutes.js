import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  getTasksByProject,
  updateTask,
  moveTask,
  deleteTask
} from '../controllers/taskController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(checkWorkspaceAccess);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.delete('/:id', deleteTask);

export default router;