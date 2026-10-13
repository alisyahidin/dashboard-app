import expres, { Router } from 'express';

import auth from './auth.js';
import invites from './invites.js';
import reports from './reports.js';
import roles from './roles.js';
import users from './users.js';

const router: Router = expres.Router();

router.use('/auth', auth);
router.use('/invites', invites);
router.use('/reports', reports);
router.use('/roles', roles);
router.use('/users', users);

export default router;