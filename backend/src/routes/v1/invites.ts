import expres, { Router } from 'express';
import { acceptInvite, getInvite } from '../../controllers/invite.controller.js';

const router: Router = expres.Router();

router.get('/:token', getInvite);
router.post('/:token/accept', acceptInvite);

export default router;
