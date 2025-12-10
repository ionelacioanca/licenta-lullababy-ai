// backend/routes/chatbotRoutes.js

import express from 'express';
const router = express.Router();
import auth from '../middleware/authMiddleware.js';
import { chatWithBot } from '../controllers/chatbotController.js';

// POST /api/chatbot  → trimite { message: "..." }
router.post("/chatbot", auth, chatWithBot); // ⬅️ endpoint pentru chatbot with authentication

export default router;
