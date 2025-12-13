import express from 'express';
import { getBudgets, getBudgetById, designBudget } from '../controllers/budgetController';

const router = express.Router();

router.get('/', getBudgets);
router.get('/:id', getBudgetById);
router.post('/design/:meetingId', designBudget);

export default router;



