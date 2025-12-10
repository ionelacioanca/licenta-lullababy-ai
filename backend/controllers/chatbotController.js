// backend/controllers/chatbotController.js

import { getChatbotReply } from '../ai/chatbotService.js';
import Baby from '../models/Baby.js';
import GrowthRecord from '../models/GrowthRecord.js';

export const chatWithBot = async (req, res, next) => {
  try {
    const { message, language, babyId } = req.body; // ⬅️ mesajul, limba și babyId trimise din aplicația mobilă

    console.log('[Chatbot Controller] Received request:', { message: message?.substring(0, 50), language, babyId });

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required and must be a string." });
    }

    // Fetch baby information if babyId is provided
    let babyContext = null;
    if (babyId) {
      console.log('[Chatbot Controller] BabyId provided, fetching baby info...');
      try {
        const baby = await Baby.findById(babyId);
        if (baby) {
          // Calculate baby's age
          const birthDate = new Date(baby.birthDate);
          const now = new Date();
          const ageInMonths = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30.44));
          const ageInDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));

          // Get latest growth measurements
          const latestGrowth = await GrowthRecord.findOne({ babyId })
            .sort({ recordDate: -1 })
            .limit(1);

          babyContext = {
            name: baby.name,
            gender: baby.gender,
            ageInMonths,
            ageInDays,
            birthDate: baby.birthDate,
            weight: latestGrowth?.weight || null,
            length: latestGrowth?.length || null,
            headCircumference: latestGrowth?.headCircumference || null,
          };

          console.log('[Chatbot] Baby context:', babyContext);
        }
      } catch (error) {
        console.error('[Chatbot] Error fetching baby info:', error);
        // Continue without baby context if there's an error
      }
    }

    const reply = await getChatbotReply(message, language, babyContext);

    return res.json({ reply }); // ⬅️ răspunsul din BabyCareBuddy
  } catch (err) {
    console.error("Error in chatWithBot:", err.message);
    // dacă ai deja errorHandler global, trimitem mai departe
    next(err);
  }
};
