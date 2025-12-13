import express from 'express';
import messageRoutes from './messageRoutes';
import webhookRoutes from './webhookRoutes';
import agentRoutes from './agentRoutes';
import mcpRoutes from './mcpRoutes';
import meetingRoutes from './meetingRoutes';
import budgetRoutes from './budgetRoutes';
import allocationRoutes from './allocationRoutes';

const router = express.Router();

router.use('/messages', messageRoutes);
router.use('/webhook', webhookRoutes);
router.use('/agent', agentRoutes);
router.use('/mcp', mcpRoutes);
router.use('/meetings', meetingRoutes);
router.use('/budgets', budgetRoutes);
router.use('/allocations', allocationRoutes);

export default router;

