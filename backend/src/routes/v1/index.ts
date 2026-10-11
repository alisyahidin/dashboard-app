import expres, { Router } from 'express';

import auth from './auth.js';

const router: Router = expres.Router();

router.use('/auth', auth);

export default router;