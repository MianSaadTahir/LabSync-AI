const express = require('express');
const { routeToProject } = require('../controllers/mcpController');

const router = express.Router();

router.post('/route', routeToProject);

module.exports = router;

