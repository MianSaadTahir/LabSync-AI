import express from 'express';
import { getAllocations, getAllocationById } from '../controllers/allocationController';

const router = express.Router();

router.get('/', getAllocations);
router.get('/:id', getAllocationById);

export default router;





