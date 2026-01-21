import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import * as senderController from '../controllers/senderController';

const router = express.Router();

router.get('/', isAuthenticated, senderController.getSenders);
router.post('/', isAuthenticated, senderController.createSender);

export default router;
