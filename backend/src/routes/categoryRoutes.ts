import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { validateFirebaseToken } from '../middleware/validateFirebaseToken';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.get('/', categoryController.getCategories);
router.post('/', validateFirebaseToken, adminGuard, categoryController.createCategory);
router.put('/:id', validateFirebaseToken, adminGuard, categoryController.updateCategory);
router.delete('/:id', validateFirebaseToken, adminGuard, categoryController.deleteCategory);

export default router;
