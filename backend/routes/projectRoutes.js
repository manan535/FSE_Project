import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  getMyProjects,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(checkWorkspaceAccess);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/my', getMyProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;