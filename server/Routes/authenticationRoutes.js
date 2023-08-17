const userAuth = require("../Controllers/Authentication/userAuth");
const express = require("express");
const { verify } = require("../Middleware/verify");
const router = express.Router();

router.route("/signup").post(userAuth.RegisterUser);
router.route("/login").post(userAuth.LoginUser);
router.route("/user").get(verify, userAuth.UserById);
router.route("/searchUsers").post(userAuth.searchUsers);

module.exports = router;
