const express = require('express');
const messageRoutes = require('./messageRoutes');
const webhookRoutes = require('./webhookRoutes');


const router = express.Router();

router.use('/messages', messageRoutes);
router.use('/webhook', webhookRoutes);


module.exports = router;
