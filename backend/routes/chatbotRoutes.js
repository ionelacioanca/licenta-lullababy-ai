// backend/routes/chatbotRoutes.js

import express from 'express';
const router = express.Router();

import { chatWithBot } from '../controllers/chatbotController.js';

// POST /api/chatbot  → trimite { message: "..." }
router.post("/chatbot", chatWithBot); // ⬅️ endpoint pentru chatbot

export default router;
