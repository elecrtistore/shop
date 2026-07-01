import { Router } from 'express';
import * as emailController from '../controllers/emailController';
import { validateFirebaseToken } from '../middleware/validateFirebaseToken';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.post('/subscribe', emailController.subscribe);
router.get('/subscribers', validateFirebaseToken, adminGuard, emailController.getSubscribers);
router.delete('/subscribers/:id', validateFirebaseToken, adminGuard, emailController.deleteSubscriber);
router.post('/send', validateFirebaseToken, adminGuard, emailController.sendEmail);

export default router;
