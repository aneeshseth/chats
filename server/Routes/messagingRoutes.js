const getMessages = require("../Controllers/Chats/OneOnOne");
const express = require("express");
const { verify } = require("../Middleware/verify");
const router = express.Router();

router.route("/chats/:id").get(getMessages.getAllMessages);

module.exports = router;
