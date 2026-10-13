import expres, { Router } from 'express';
import { listUsers } from '../../controllers/user.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router: Router = expres.Router();

router.get('/', requireAuth, requireRole('admin'), listUsers);

export default router;
