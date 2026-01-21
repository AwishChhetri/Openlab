import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth';
import * as campaignController from '../controllers/campaignController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', isAuthenticated, campaignController.listCampaigns);
router.get('/stats/summary', isAuthenticated, campaignController.getSummary);
router.get('/:id/emails', isAuthenticated, campaignController.getCampaignEmails);
router.get('/:id/stats', isAuthenticated, campaignController.getCampaignStats);
router.get('/emails/:id', isAuthenticated, campaignController.getEmail);
router.post('/schedule', isAuthenticated, upload.single('csv'), campaignController.schedule);

export default router;
