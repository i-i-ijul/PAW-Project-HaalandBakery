const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatControllers");

router.get("/", (req, res) => {
  res.render("chat", { title: "Chatbot" });
});

router.post("/api/chat", chatController.handleChat);

module.exports = router;