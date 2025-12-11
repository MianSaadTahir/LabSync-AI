import express from 'express';
import { getMeetings, getMeetingById } from '../controllers/meetingController';

const router = express.Router();

router.get('/', getMeetings);
router.get('/:id', getMeetingById);

export default router;





