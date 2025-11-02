import { Router } from 'express';
import * as controller from 'controllers/user.controller';
import { isAuthenticated } from '@/middlewares/isAuthenticated';

const router = Router();

router.use(isAuthenticated);

router.get('/', controller.getAll);
router.get('/:id', controller.getId);

router.post('/', controller.create);

router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
