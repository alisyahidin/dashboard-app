import expres, { Router } from 'express';

import auth from './auth.js';
import reports from './reports.js';
import users from './users.js';

const router: Router = expres.Router();

router.use('/auth', auth);
router.use('/reports', reports);
router.use('/users', users);

export default router;