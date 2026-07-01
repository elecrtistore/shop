import { Router } from 'express';
import * as inquiryController from '../controllers/inquiryController';
import { validateFirebaseToken } from '../middleware/validateFirebaseToken';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.post('/', inquiryController.createInquiry);
router.get('/', validateFirebaseToken, adminGuard, inquiryController.getInquiries);
router.get('/my', validateFirebaseToken, inquiryController.getMyInquiries);
router.get('/:id', validateFirebaseToken, inquiryController.getInquiryById);
router.put('/:id/status', validateFirebaseToken, adminGuard, inquiryController.updateInquiryStatus);

export default router;
