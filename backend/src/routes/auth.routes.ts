import { Router } from 'express';
import * as controller from '@/controllers/auth.controller';
import { isAuthenticated } from '@/middlewares/isAuthenticated';
import rateLimit from 'express-rate-limit';

// Basic IP rate limit for all auth endpoints (adjust values)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

const router = Router();

// router.use(authLimiter);

router.post('/login', controller.login);
router.post('/signup', controller.signup);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.get('/session', isAuthenticated, controller.getSessionUser);
router.post('/logout', isAuthenticated, controller.logout);

export default router;
