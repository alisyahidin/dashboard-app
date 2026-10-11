import expres, { Router } from 'express';

const router: Router = expres.Router();

router.post('/login', (_req, res) => {
  res.json({ message: 'Hellow World' })
})

export default router;