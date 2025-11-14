// backend/routes/chatRoutes.js

const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");

// POST /api/chatbot  → trimite { message: "..." }
router.post("/chatbot", chatController.chatWithBot); // ⬅️ endpoint pentru chatbot

module.exports = router;
