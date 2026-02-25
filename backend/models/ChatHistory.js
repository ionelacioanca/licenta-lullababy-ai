// backend/models/ChatHistory.js

import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    default: null,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  language: {
    type: String,
    enum: ['ro', 'en'],
    default: 'ro'
  },
  // Context folosit pentru răspunsul AI (doar pentru role: 'assistant')
  contextUsed: {
    babyAge: Number,
    babyWeight: Number,
    babyLength: Number,
    userName: String,
    userRole: String
  },
  // Pentru debugging și îmbunătățire continuă
  metadata: {
    responseTime: Number, // milliseconds
    knowledgeFilesUsed: [String], // fișiere RAG folosite
    model: String, // 'gemini' sau 'openai'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Index compus pentru query-uri rapide
chatHistorySchema.index({ userId: 1, babyId: 1, createdAt: -1 });
chatHistorySchema.index({ createdAt: 1 }); // Pentru ștergere automată după 90 zile (GDPR)

// Virtual pentru a obține perechi întrebare-răspuns
chatHistorySchema.virtual('conversationPair', {
  ref: 'ChatHistory',
  localField: '_id',
  foreignField: '_id'
});

// Metodă statică pentru ștergerea conversațiilor vechi (GDPR compliance)
chatHistorySchema.statics.deleteOldConversations = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  console.log(`[ChatHistory] Deleted ${result.deletedCount} conversations older than ${daysOld} days`);
  return result;
};

// Metodă pentru curățarea datelor înainte de export (GDPR)
chatHistorySchema.methods.toSafeObject = function() {
  return {
    role: this.role,
    content: this.content,
    timestamp: this.createdAt,
    language: this.language
  };
};

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
