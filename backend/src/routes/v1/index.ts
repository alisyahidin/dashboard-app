import expres, { Router } from 'express';

import auth from './auth.js';
import reports from './reports.js';

const router: Router = expres.Router();

router.use('/auth', auth);
router.use('/reports', reports);

export default router;