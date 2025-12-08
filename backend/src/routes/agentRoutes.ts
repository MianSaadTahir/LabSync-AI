import express from 'express';
import { extractFromMessage, extractMeeting } from '../controllers/agentController';

const router = express.Router();

router.post('/extract/:messageId', extractFromMessage);
router.post('/extract-meeting/:messageId', extractMeeting);

export default router;

