import express from 'express';
import {
    getAllocations,
    getAllocationById,
    updateAllocationSpent,
    recordExpense
} from '../controllers/allocationController';

const router = express.Router();

router.get('/', getAllocations);
router.get('/:id', getAllocationById);
router.patch('/:id/spend', updateAllocationSpent);  // Update total actual_spent
router.post('/:id/expense', recordExpense);         // Add an expense

export default router;

