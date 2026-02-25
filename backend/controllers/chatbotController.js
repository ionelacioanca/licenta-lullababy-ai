// backend/controllers/chatbotController.js

import { getChatbotReply } from '../ai/chatbotService.js';
import Baby from '../models/Baby.js';
import GrowthRecord from '../models/GrowthRecord.js';
import User from '../models/User.js';
import ChatHistory from '../models/ChatHistory.js';

export const chatWithBot = async (req, res, next) => {
  const requestStartTime = Date.now(); // Pentru tracking response time
  
  try {
    const { message, language, babyId } = req.body; // ⬅️ mesajul, limba și babyId trimise din aplicația mobilă

    console.log('[Chatbot Controller] Received request:');
    console.log('  - Message:', message?.substring(0, 50));
    console.log('  - Language:', language, '(type:', typeof language, ')');
    console.log('  - BabyId:', babyId);
    console.log('  - Authorization header:', req.headers['authorization'] ? 'Present' : 'MISSING');

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required and must be a string." });
    }
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User authentication required." });
    }

    // Fetch user information from authenticated request
    let userContext = null;
    console.log('[Chatbot] req.user:', req.user);
    console.log('[Chatbot] req.user exists?', !!req.user);
    console.log('[Chatbot] req.user.userId:', req.user?.userId);
    if (req.user && req.user.userId) {
      try {
        const user = await User.findById(req.user.userId).select('name role customRole relatedParentIds');
        console.log('[Chatbot] Full user from DB:', JSON.stringify(user, null, 2));
        if (user) {
          // Determine the actual role to display
          let displayRole = user.role;
          if (user.role === 'others' && user.customRole) {
            // Map custom roles like 'aunt', 'uncle', 'grandma', 'grandpa'
            // Convert to lowercase to match role translations
            displayRole = user.customRole.toLowerCase();
          }
          
          userContext = {
            name: user.name,
            role: displayRole,
          };
          console.log('[Chatbot] User context retrieved:', userContext);
        } else {
          console.log('[Chatbot] User not found in database');
        }
      } catch (error) {
        console.error('[Chatbot] Error fetching user info:', error);
      }
    } else {
      console.log('[Chatbot] No authenticated user - req.user is missing');
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

    const reply = await getChatbotReply(message, language, babyContext, userContext);
    
    const responseTime = Date.now() - requestStartTime;

    // ✅ SALVARE CONVERSAȚIE ÎN BAZA DE DATE
    try {
      // 1. Salvăm întrebarea utilizatorului
      const userMessage = new ChatHistory({
        userId: req.user.userId,
        babyId: babyId || null,
        role: 'user',
        content: message,
        language: language || 'ro',
        metadata: {
          responseTime: null,
          model: null
        }
      });
      await userMessage.save();
      console.log('[ChatHistory] User message saved:', userMessage._id);

      // 2. Salvăm răspunsul AI-ului
      const assistantMessage = new ChatHistory({
        userId: req.user.userId,
        babyId: babyId || null,
        role: 'assistant',
        content: reply,
        language: language || 'ro',
        contextUsed: {
          babyAge: babyContext?.ageInMonths || null,
          babyWeight: babyContext?.weight || null,
          babyLength: babyContext?.length || null,
          userName: userContext?.name || null,
          userRole: userContext?.role || null
        },
        metadata: {
          responseTime: responseTime,
          model: process.env.AI_MODEL || 'gemini', // din .env sau default
          knowledgeFilesUsed: [] // TODO: poate adăugi din chatbotService
        }
      });
      await assistantMessage.save();
      console.log('[ChatHistory] AI response saved:', assistantMessage._id, `(${responseTime}ms)`);
      
    } catch (saveError) {
      // NU blocăm răspunsul dacă salvarea eșuează - doar logăm
      console.error('[ChatHistory] ERROR saving conversation:', saveError);
    }

    return res.json({ reply }); // ⬅️ răspunsul din BabyCareBuddy
  } catch (err) {
    console.error("Error in chatWithBot:", err.message);
    // dacă ai deja errorHandler global, trimitem mai departe
    next(err);
  }
};

// 📜 GET /api/chatbot/history - Obține istoricul conversațiilor
export const getChatHistory = async (req, res, next) => {
  try {
    const { babyId, limit = 50 } = req.query;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User authentication required." });
    }

    const query = { userId: req.user.userId };
    if (babyId) {
      query.babyId = babyId;
    }

    const history = await ChatHistory.find(query)
      .sort({ createdAt: -1 }) // Mai noi primele
      .limit(parseInt(limit))
      .select('-__v'); // Excldem __v

    // Grupăm în perechi întrebare-răspuns pentru UI
    const conversations = [];
    for (let i = history.length - 1; i >= 0; i -= 2) {
      if (i >= 1 && history[i].role === 'user' && history[i - 1].role === 'assistant') {
        conversations.push({
          question: history[i],
          answer: history[i - 1]
        });
      }
    }

    return res.json({ 
      conversations: conversations.reverse(), // Ordinea cronologică
      total: history.length 
    });
  } catch (err) {
    console.error("Error in getChatHistory:", err.message);
    next(err);
  }
};

// 🗑️ DELETE /api/chatbot/history - Șterge istoricul utilizatorului
export const deleteChatHistory = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User authentication required." });
    }

    const result = await ChatHistory.deleteMany({ userId: req.user.userId });
    
    console.log(`[ChatHistory] User ${req.user.userId} deleted ${result.deletedCount} messages`);
    
    return res.json({ 
      message: "Chat history deleted successfully",
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error("Error in deleteChatHistory:", err.message);
    next(err);
  }
};
