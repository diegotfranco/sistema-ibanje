import { Router } from 'express';
import auth from '@/routes/auth.routes';
import users from 'routes/users.routes';
import { notFound } from '@/routes/notFound';
import { healthCheck } from '@/routes/healthCheck';
import { isAuthenticated } from 'middlewares/isAuthenticated';

const router = Router();

router.use('/api/v1/auth', auth);
router.use('/api/v1/users', isAuthenticated, users);
router.use('/health', healthCheck);
router.use(notFound);

export default router;
