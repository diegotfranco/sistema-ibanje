import { Router } from 'express';
import auth from '@/routes/auth.routes';
import users from '@/routes/user.routes';
import { notFound } from '@/routes/notFound';
import { healthCheck } from '@/routes/healthCheck';

const router = Router();

router.use('/api/v1/auth', auth);
router.use('/api/v1/users', users);
router.use('/api/v1/health', healthCheck);
router.use(notFound);

export default router;
