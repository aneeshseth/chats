const chatGroup = require("../Controllers/ChatGroups/chatGroup");
const express = require("express");
const { verify } = require("../Middleware/verify");
const router = express.Router();

router.route("/chatGroups").get(verify, chatGroup.getChatGroups);

module.exports = router;
