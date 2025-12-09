import express from 'express';
import {
  getAlertsByBaby,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteAlert
} from '../controllers/alertController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all alerts for a baby
router.get('/baby/:babyId', authMiddleware, getAlertsByBaby);

// Get unread count
router.get('/baby/:babyId/unread-count', authMiddleware, getUnreadCount);

// Mark alert as read
router.put('/:alertId/read', authMiddleware, markAsRead);

// Mark all alerts as read
router.put('/baby/:babyId/read-all', authMiddleware, markAllAsRead);

// Delete alert
router.delete('/:alertId', authMiddleware, deleteAlert);

export default router;
