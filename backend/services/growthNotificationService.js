import GrowthNotification from '../models/GrowthNotification.js';
import Baby from '../models/Baby.js';
import User from '../models/User.js';
import LinkRequest from '../models/LinkRequest.js';
import { sendPushNotification } from './pushNotificationService.js';

class GrowthNotificationService {
  /**
   * Calculate next measurement date based on baby's age
   * Logic:
   * - 0-6 months: monthly (every month on birth date)
   * - 6-12 months: every 2 months
   * - 12+ months: every 3 months
   */
  calculateNextMeasurementDate(birthDate, currentDate = new Date()) {
    const birth = new Date(birthDate);
    const current = new Date(currentDate);
    
    // Calculate age in months
    const ageInMonths = this.calculateAgeInMonths(birth, current);
    
    // Get the day of birth
    const dayOfBirth = birth.getDate();
    
    // Determine interval based on age
    let intervalMonths;
    if (ageInMonths < 6) {
      intervalMonths = 1; // Monthly until 6 months
    } else if (ageInMonths < 12) {
      intervalMonths = 2; // Every 2 months from 6-12 months
    } else {
      intervalMonths = 3; // Every 3 months after 12 months
    }
    
    // Calculate next date
    const nextDate = new Date(current);
    nextDate.setMonth(nextDate.getMonth() + intervalMonths);
    
    // Set to birth day (handle month overflow)
    const maxDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    nextDate.setDate(Math.min(dayOfBirth, maxDay));
    
    // Set time to 10:00 AM
    nextDate.setHours(10, 0, 0, 0);
    
    return {
      date: nextDate,
      ageInMonths: ageInMonths + intervalMonths,
      intervalMonths
    };
  }

  /**
   * Calculate age in complete months
   */
  calculateAgeInMonths(birthDate, currentDate = new Date()) {
    const birth = new Date(birthDate);
    const current = new Date(currentDate);
    
    let months = (current.getFullYear() - birth.getFullYear()) * 12;
    months += current.getMonth() - birth.getMonth();
    
    // Adjust if current day is before birth day
    if (current.getDate() < birth.getDate()) {
      months--;
    }
    
    return Math.max(0, months);
  }

  /**
   * Create initial notification schedule for a new baby
   */
  async scheduleInitialNotifications(babyId) {
    try {
      const baby = await Baby.findById(babyId).populate('parentId');
      if (!baby) {
        throw new Error('Baby not found');
      }

      // Get all users who should receive notifications (parent + linked users)
      const users = await this.getAllUsersThatCanAccess(babyId);

      // Calculate first measurement date that should happen
      const nextMeasurement = this.calculateInitialMeasurementDate(baby.birthDate);
      
      // Create notifications for all relevant users
      const notifications = [];
      for (const user of users) {
        const notification = new GrowthNotification({
          babyId: baby._id,
          userId: user._id,
          scheduledDate: nextMeasurement.date,
          ageInMonths: nextMeasurement.ageInMonths,
        title: `Time to measure ${baby.name}`,
        body: `${baby.name} is ${nextMeasurement.ageInMonths} month${nextMeasurement.ageInMonths > 1 ? 's' : ''} old. Record weight and length.`,
      }

      console.log(`✅ Scheduled ${notifications.length} growth notifications for baby ${baby.name}`);
      return notifications;
    } catch (error) {
      console.error('Error scheduling initial notifications:', error);
      throw error;
    }
  }

  /**
   * Calculate the next measurement date that should happen based on baby's age
   * (Used for initial scheduling)
   */
  calculateInitialMeasurementDate(birthDate) {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = this.calculateAgeInMonths(birth, now);
    const dayOfBirth = birth.getDate();
    
    // Calculate what the current age's measurement date would be
    const currentAgeMeasurement = new Date(birth);
    currentAgeMeasurement.setMonth(birth.getMonth() + ageInMonths);
    const maxDay = new Date(currentAgeMeasurement.getFullYear(), currentAgeMeasurement.getMonth() + 1, 0).getDate();
    currentAgeMeasurement.setDate(Math.min(dayOfBirth, maxDay));
    currentAgeMeasurement.setHours(10, 0, 0, 0);
    
    // Compare dates (ignore time) - if we're ON or BEFORE the measurement date for current age
    const currentAgeDate = new Date(currentAgeMeasurement.getFullYear(), currentAgeMeasurement.getMonth(), currentAgeMeasurement.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (currentAgeDate >= todayDate && ageInMonths > 0) {
      // Schedule for current age (we haven't passed that date yet)
      return {
        date: currentAgeMeasurement,
        ageInMonths: ageInMonths,
        intervalMonths: 0
      };
    }
    
    // Otherwise, determine next age based on intervals
    let nextAgeInMonths;
    if (ageInMonths < 6) {
      // Monthly: next month
      nextAgeInMonths = ageInMonths + 1;
    } else if (ageInMonths < 12) {
      // Every 2 months: round up to next 2-month interval
      nextAgeInMonths = Math.ceil((ageInMonths + 1) / 2) * 2;
    } else {
      // Every 3 months: round up to next 3-month interval
      nextAgeInMonths = Math.ceil((ageInMonths + 1) / 3) * 3;
    }
    
    // Calculate date by adding months to birth date
    const nextDate = new Date(birth);
    nextDate.setMonth(birth.getMonth() + nextAgeInMonths);
    
    // Handle month overflow
    const maxDayNext = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    nextDate.setDate(Math.min(dayOfBirth, maxDayNext));
    
    // Set time to 10:00 AM
    nextDate.setHours(10, 0, 0, 0);
    
    return {
      date: nextDate,
      ageInMonths: nextAgeInMonths,
      intervalMonths: nextAgeInMonths - ageInMonths
    };
  }

  /**
   * Schedule next notification after completing a measurement
   */
  async scheduleNextNotification(babyId, userId) {
    try {
      const baby = await Baby.findById(babyId);
      if (!baby) {
        throw new Error('Baby not found');
      }

      // Calculate next measurement date
      const nextMeasurement = this.calculateNextMeasurementDate(baby.birthDate);
      
      // Check if notification already exists
      const existingNotification = await GrowthNotification.findOne({
        babyId: baby._id,
        userId: userId,
        scheduledDate: { $gte: new Date() },
        status: 'pending'
      });

      if (existingNotification) {
        console.log('Next notification already scheduled');
        return existingNotification;
      }

      // Create new notification
      const notification = new GrowthNotification({
        babyId: baby._id,
        userId: userId,
        scheduledDate: nextMeasurement.date,
        ageInMonths: nextMeasurement.ageInMonths,
        title: `Time to measure ${baby.name}`,
        body: `${baby.name} is ${nextMeasurement.ageInMonths} month${nextMeasurement.ageInMonths > 1 ? 's' : ''} old. Record weight and length.`,
        status: 'pending'
      });
      
      await notification.save();
      console.log(`✅ Scheduled next growth notification for ${baby.name} at ${nextMeasurement.date}`);
      return notification;
    } catch (error) {
      console.error('Error scheduling next notification:', error);
      throw error;
    }
  }

  /**
   * Send pending growth notifications
   * This should be called periodically (e.g., via cron job)
   */
  async sendPendingNotifications() {
    try {
      const now = new Date();
      
      // Find all pending notifications that should be sent
      const pendingNotifications = await GrowthNotification.find({
        status: 'pending',
        scheduledDate: { $lte: now }
      }).populate('babyId userId');

      console.log(`📬 Found ${pendingNotifications.length} pending growth notifications to send`);

      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const notification of pendingNotifications) {
        try {
          const user = notification.userId;
          const baby = notification.babyId;

          // Send push notification if user has push token
          if (user.pushToken) {
            await sendPushNotification(
              user.pushToken,
              notification.title,
              notification.body,
              {
                type: 'growth_reminder',
                babyId: baby._id.toString(),
                notificationId: notification._id.toString(),
                screen: 'growth'
              }
            );
          }

          // Mark as sent
          notification.status = 'sent';
          notification.sentAt = new Date();
          await notification.save();

          results.sent++;
          console.log(`✅ Sent growth notification to ${user.name} for baby ${baby.name}`);
        } catch (error) {
          console.error(`❌ Failed to send notification ${notification._id}:`, error);
          results.failed++;
          results.errors.push({
            notificationId: notification._id,
            error: error.message
          });
        }
      }

      console.log(`📊 Notification results: ${results.sent} sent, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Error sending pending notifications:', error);
      throw error;
    }
  }

  /**
   * Get all in-app notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { includeRead = true, limit = 50, skip = 0 } = options;
      
      // Get all babies the user has access to (using same logic as getBabiesByParentId)
      const currentUser = await User.findById(userId);
      const parentIds = [userId];
      
      if (currentUser) {
        // For nanny or others with relatedParentIds: add all linked parents from array
        if (currentUser.relatedParentIds && currentUser.relatedParentIds.length > 0) {
          parentIds.push(...currentUser.relatedParentIds);
        }
        // For mother/father/others: also add single linked parent if exists
        if (currentUser.relatedParentId) {
          parentIds.push(currentUser.relatedParentId);
        }
      }
      
      // Get all babies from all parent IDs
      const babies = await Baby.find({ parentId: { $in: parentIds } }).select('_id');
      const babyIds = babies.map(b => b._id);
      
      // Build query to find notifications for these babies
      // Only show sent and dismissed notifications (not pending or completed)
      const query = { 
        babyId: { $in: babyIds },
        status: { $in: ['sent', 'dismissed'] }
      };
      if (!includeRead) {
        query.read = false;
      }

      const notifications = await GrowthNotification.find(query)
        .populate('babyId', 'name avatarColor avatarImage')
        .sort({ scheduledDate: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const unreadCount = await GrowthNotification.countDocuments({
        babyId: { $in: babyIds },
        read: false,
        status: 'sent'
      });

      return {
        notifications,
        unreadCount,
        total: notifications.length
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const notification = await GrowthNotification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as completed (user recorded the measurement)
   */
  async markAsCompleted(notificationId, userId) {
    try {
      const notification = await GrowthNotification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.status = 'completed';
      notification.completedAt = new Date();
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      // Schedule next notification
      await this.scheduleNextNotification(notification.babyId, userId);

      return notification;
    } catch (error) {
      console.error('Error marking notification as completed:', error);
      throw error;
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId) {
    try {
      const notification = await GrowthNotification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.status = 'dismissed';
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  }

  /**
   * Get all users that have access to a baby (parent + linked users)
   */
  async getAllUsersThatCanAccess(babyId) {
    try {
      const baby = await Baby.findById(babyId).populate('parentId');
      if (!baby) {
        throw new Error('Baby not found');
      }

      if (!baby.parentId) {
        console.warn(`⚠️  Baby ${baby.name} has no parentId assigned`);
        return [];
      }

      const users = [baby.parentId];

      // Find accepted link requests where this baby's parent is the target
      const acceptedLinks = await LinkRequest.find({
        parentId: baby.parentId._id,
        status: 'accepted'
      }).populate('requesterId');

      for (const link of acceptedLinks) {
        users.push(link.requesterId);
      }

      return users;
    } catch (error) {
      console.error('Error getting users that can access baby:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (optional maintenance)
   */
  async cleanupOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await GrowthNotification.deleteMany({
        status: { $in: ['completed', 'dismissed'] },
        updatedAt: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old growth notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

export default new GrowthNotificationService();
