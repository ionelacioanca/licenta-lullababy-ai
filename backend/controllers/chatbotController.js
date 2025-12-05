// backend/controllers/chatbotController.js

import { getChatbotReply } from '../ai/chatbotService.js';

export const chatWithBot = async (req, res, next) => {
  try {
    const { message, language } = req.body; // ⬅️ mesajul și limba trimise din aplicația mobilă

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required and must be a string." });
    }

    const reply = await getChatbotReply(message, language);

    return res.json({ reply }); // ⬅️ răspunsul din BabyCareBuddy
  } catch (err) {
    console.error("Error in chatWithBot:", err.message);
    // dacă ai deja errorHandler global, trimitem mai departe
    next(err);
  }
};
