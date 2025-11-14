// backend/controllers/chatController.js

const { getChatbotReply } = require("../ai/chatbotService"); // ⬅️ folosim serviciul de mai sus

exports.chatWithBot = async (req, res, next) => {
  try {
    const { message } = req.body; // ⬅️ mesajul trimis din aplicația mobilă

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required and must be a string." });
    }

    const reply = await getChatbotReply(message);

    return res.json({ reply }); // ⬅️ răspunsul din BabyCareBuddy
  } catch (err) {
    console.error("Error in chatWithBot:", err.message);
    // dacă ai deja errorHandler global, trimitem mai departe
    next(err);
  }
};
