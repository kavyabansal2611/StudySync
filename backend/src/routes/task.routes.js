import { Router } from 'express';

import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../controllers/task.controller.js';

const router = Router();

// All routes are protected by the verifyJWT middleware in app.js, so no need to add it here again.
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;