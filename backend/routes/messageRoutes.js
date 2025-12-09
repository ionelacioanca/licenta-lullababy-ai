import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Send a message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;

    console.log('[Send Message] Sender:', senderId, 'Receiver:', receiverId);

    // Get sender and receiver info
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if users are linked
    const senderLinkedIds = (sender.relatedParentIds || []).map(id => id.toString());
    const isLinked = senderLinkedIds.includes(receiverId);

    console.log('[Send Message] Sender linked IDs:', senderLinkedIds);
    console.log('[Send Message] Is linked:', isLinked);

    if (!isLinked) {
      return res.status(403).json({ message: 'You can only send messages to linked users' });
    }

    // Create message
    const message = new Message({
      senderId,
      senderName: sender.name,
      receiverId,
      receiverName: receiver.name,
      content
    });

    await message.save();
    console.log('[Send Message] Message sent successfully');

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('[Send Message] Error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get conversations (list of linked users with last message)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('[Conversations] User:', userId);

    // Get current user with linked users
    const currentUser = await User.findById(userId).populate('relatedParentIds', 'name email profilePicture');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const linkedUsers = currentUser.relatedParentIds || [];
    console.log('[Conversations] Linked users count:', linkedUsers.length);

    // Get last message and unread count for each linked user
    const conversations = await Promise.all(
      linkedUsers.map(async (linkedUser) => {
        const linkedUserId = linkedUser._id.toString();

        // Get last message between users
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: linkedUserId },
            { senderId: linkedUserId, receiverId: userId }
          ]
        }).sort({ createdAt: -1 });

        // Count unread messages from this user
        const unreadCount = await Message.countDocuments({
          senderId: linkedUserId,
          receiverId: userId,
          read: false
        });

        return {
          userId: linkedUser._id,
          name: linkedUser.name,
          email: linkedUser.email,
          profilePicture: linkedUser.profilePicture || null,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            sentByMe: lastMessage.senderId.toString() === userId
          } : null,
          unreadCount
        };
      })
    );

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return timeB - timeA;
    });

    console.log('[Conversations] Returning', conversations.length, 'conversations');
    res.json({ conversations });
  } catch (error) {
    console.error('[Conversations] Error:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

// Get messages with a specific user
router.get('/with/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    console.log('[Get Messages] Between:', currentUserId, 'and', otherUserId);

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    console.log('[Get Messages] Found', messages.length, 'messages');

    // Mark messages from the other user as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ messages });
  } catch (error) {
    console.error('[Get Messages] Error:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get unread message count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });

    console.log('[Unread Count] User:', userId, 'Count:', unreadCount);
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('[Unread Count] Error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

export default router;
