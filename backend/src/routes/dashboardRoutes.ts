import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { validateFirebaseToken } from '../middleware/validateFirebaseToken';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.get('/stats', validateFirebaseToken, adminGuard, dashboardController.getStats);

export default router;
