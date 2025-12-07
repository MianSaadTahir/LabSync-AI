const express = require("express");
const { extractFromMessage } = require("../controllers/agentController");

const router = express.Router();

router.post("/extract/:messageId", extractFromMessage);

module.exports = router;
