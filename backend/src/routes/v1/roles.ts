import expres, { Router } from 'express';
import { listRoles } from '../../controllers/role.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router: Router = expres.Router();

router.get('/', requireAuth, requireRole('admin'), listRoles);

export default router;
