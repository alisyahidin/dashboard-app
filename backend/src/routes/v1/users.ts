import expres, { Router } from 'express';
import { createUser, listUsers, updateUser } from '../../controllers/user.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router: Router = expres.Router();

router.get('/', requireAuth, requireRole('admin', 'supervisor'), listUsers);
router.post('/', requireAuth, requireRole('admin'), createUser);
router.patch('/:id', requireAuth, requireRole('admin'), updateUser);

export default router;
