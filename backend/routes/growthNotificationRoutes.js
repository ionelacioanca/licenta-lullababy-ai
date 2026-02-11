import express from 'express';
import growthNotificationService from '../services/growthNotificationService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/growth-notifications
 * Get all notifications for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { includeRead, limit, skip } = req.query;

    console.log('📊 GET /api/growth-notifications - userId:', userId);
    console.log('   req.user:', req.user);
    console.log('   Query params:', { includeRead, limit, skip });

    const options = {
      includeRead: includeRead !== 'false',
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0
    };

    const result = await growthNotificationService.getUserNotifications(userId, options);

    console.log('   Result:', { 
      notificationsCount: result.notifications.length, 
      unreadCount: result.unreadCount, 
      total: result.total 
    });

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

/**
 * POST /api/growth-notifications/:babyId/schedule
 * Schedule initial notifications for a baby
 */
router.post('/:babyId/schedule', async (req, res) => {
  try {
    const { babyId } = req.params;
    
    const notifications = await growthNotificationService.scheduleInitialNotifications(babyId);

    res.status(201).json({
      message: 'Growth notifications scheduled successfully',
      data: notifications
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    res.status(500).json({
      message: 'Error scheduling notifications',
      error: error.message
    });
  }
});

/**
 * PUT /api/growth-notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await growthNotificationService.markAsRead(notificationId);

    res.status(200).json({
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

/**
 * PUT /api/growth-notifications/:notificationId/complete
 * Mark a notification as completed (measurement was recorded)
 */
router.put('/:notificationId/complete', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId || req.user._id || req.user.id;
    
    const notification = await growthNotificationService.markAsCompleted(notificationId, userId);

    res.status(200).json({
      message: 'Notification marked as completed',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as completed:', error);
    res.status(500).json({
      message: 'Error marking notification as completed',
      error: error.message
    });
  }
});

/**
 * PUT /api/growth-notifications/:notificationId/dismiss
 * Dismiss a notification
 */
router.put('/:notificationId/dismiss', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await growthNotificationService.dismissNotification(notificationId);

    res.status(200).json({
      message: 'Notification dismissed',
      data: notification
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      message: 'Error dismissing notification',
      error: error.message
    });
  }
});

/**
 * POST /api/growth-notifications/send-pending
 * Manually trigger sending of pending notifications
 * (This would typically be called by a cron job)
 */
router.post('/send-pending', async (req, res) => {
  try {
    const results = await growthNotificationService.sendPendingNotifications();

    res.status(200).json({
      message: 'Pending notifications processed',
      data: results
    });
  } catch (error) {
    console.error('Error sending pending notifications:', error);
    res.status(500).json({
      message: 'Error sending pending notifications',
      error: error.message
    });
  }
});

/**
 * GET /api/growth-notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    
    const result = await growthNotificationService.getUserNotifications(userId, {
      includeRead: false,
      limit: 0
    });

    res.status(200).json({
      message: 'Unread count retrieved',
      data: {
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      message: 'Error fetching unread count',
      error: error.message
    });
  }
});

export default router;
