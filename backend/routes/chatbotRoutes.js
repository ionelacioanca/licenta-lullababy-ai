// backend/routes/chatbotRoutes.js

import express from 'express';
const router = express.Router();
import auth from '../middleware/authMiddleware.js';
import { chatWithBot, getChatHistory, deleteChatHistory } from '../controllers/chatbotController.js';

// POST /api/chatbot - Chat cu AI-ul
router.post("/chatbot", auth, chatWithBot);

// GET /api/chatbot/history - Obține istoricul conversațiilor
// Query params: ?babyId=xxx&limit=50
router.get("/chatbot/history", auth, getChatHistory);

// DELETE /api/chatbot/history - Șterge tot istoricul utilizatorului
router.delete("/chatbot/history", auth, deleteChatHistory);

export default router;
