import expres, { Router } from 'express';
import {
  changeReportStatus,
  createReport,
  getReport,
  getReportCounts,
  listReports,
  updateReport,
} from '../../controllers/report.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';

const router: Router = expres.Router();

router.get('/', requireAuth, requirePermission('reports:read'), listReports);
router.get('/counts', requireAuth, requirePermission('reports:read'), getReportCounts);
router.get('/:id', requireAuth, requirePermission('reports:read'), getReport);
router.post('/', requireAuth, requirePermission('reports:write'), createReport);
router.patch('/:id', requireAuth, requirePermission('reports:edit'), updateReport);
router.post('/:id/status', requireAuth, requirePermission('reports:approve'), changeReportStatus);

export default router;
