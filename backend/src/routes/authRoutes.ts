import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateFirebaseToken } from '../middleware/validateFirebaseToken';

const router = Router();

router.get('/profile', validateFirebaseToken, authController.getProfile);
router.post('/signup', validateFirebaseToken, authController.signup);
router.put('/profile', validateFirebaseToken, authController.updateProfile);

export default router;
