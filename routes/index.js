const express = require("express");
const webRoutes = require("./web");
const apiRoutes = require("./api");
const chatRoutes = require("../chat/chatRoutes");
const router = express.Router();

router.use("/api", apiRoutes);
router.use("/", webRoutes);
router.use("/chat", chatRoutes); 

module.exports = router;