// backend/scripts/cleanup-chat-history.js
// Script pentru ștergerea automată a conversațiilor vechi (GDPR compliance)
// Rulează automat sau prin cron job

import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lullababy';
const RETENTION_DAYS = parseInt(process.env.CHAT_HISTORY_RETENTION_DAYS) || 90;

async function cleanupOldChatHistory() {
  try {
    console.log('🧹 [Cleanup] Starting chat history cleanup...');
    console.log(`📅 [Cleanup] Retention period: ${RETENTION_DAYS} days`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ [Cleanup] Connected to MongoDB');

    // Delete old conversations
    const result = await ChatHistory.deleteOldConversations(RETENTION_DAYS);
    
    console.log(`✅ [Cleanup] Deleted ${result.deletedCount} old conversations`);
    console.log('🎉 [Cleanup] Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ [Cleanup] Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 [Cleanup] Disconnected from MongoDB');
    process.exit(0);
  }
}

// Rulează cleanup
cleanupOldChatHistory();
