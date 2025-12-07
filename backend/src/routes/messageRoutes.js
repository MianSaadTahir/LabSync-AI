const express = require("express");
const { body } = require("express-validator");
const { getMessages } = require("../controllers/messageController");

const router = express.Router();

router.get("/", getMessages);

module.exports = router;
