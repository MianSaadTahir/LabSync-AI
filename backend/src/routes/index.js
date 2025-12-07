const express = require('express');
const messageRoutes = require('./messageRoutes');
const webhookRoutes = require('./webhookRoutes');
const agentRoutes = require('./agentRoutes');
const mcpRoutes = require('./mcpRoutes');

const router = express.Router();

router.use('/messages', messageRoutes);
router.use('/webhook', webhookRoutes);
router.use('/agent', agentRoutes);
router.use('/mcp', mcpRoutes);

module.exports = router;
