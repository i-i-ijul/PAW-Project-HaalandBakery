
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatControllers");

// Halaman chatbot
router.get("/", (req, res) => {
    res.render("chat", { title: "Chatbot" });
});

// Endpoint API chatbot
router.post("/api/chat", chatController.handleChat);

module.exports = router;
