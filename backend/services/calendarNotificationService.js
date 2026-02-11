import CalendarEvent from '../models/CalendarEvent.js';
import Alert from '../models/Alert.js';
import Baby from '../models/Baby.js';
import User from '../models/User.js';
import LinkRequest from '../models/LinkRequest.js';
import { createCalendarAlert } from '../controllers/alertController.js';
import { sendPushNotification } from './pushNotificationService.js';

// Check for upcoming calendar events and create notifications
export const checkUpcomingEvents = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Find events happening tomorrow that have reminders enabled
    const upcomingEvents = await CalendarEvent.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      reminder: true,
      completed: false
    }).populate('babyId');
    
    for (const event of upcomingEvents) {
      // Check if notification already exists for this event (created within last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existingAlert = await Alert.findOne({
        calendarEventId: event._id,
        type: 'calendar',
        timestamp: { $gte: last24Hours }
      });
      
      if (!existingAlert) {
        // Create notification
        const title = `Upcoming: ${event.title}`;
        const message = event.time 
          ? `${event.title} tomorrow at ${event.time}${event.description ? ` - ${event.description}` : ''}`
          : `${event.title} tomorrow${event.description ? ` - ${event.description}` : ''}`;
        
        // Create in-app alert
        await createCalendarAlert(
          event.babyId._id,
          event._id,
          title,
          message
        );
        
        // Send push notification
        await sendPushToAllUsers(
          event.babyId._id,
          title,
          message,
          {
            type: 'calendar',
            eventId: event._id.toString(),
            babyId: event.babyId._id.toString()
          }
        );
        
        console.log(`Created notification for event: ${event.title}`);
      }
    }
    
    return upcomingEvents.length;
  } catch (error) {
    console.error('Error checking upcoming events:', error);
    throw error;
  }
};

// Check for events happening today
export const checkTodayEvents = async () => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find events happening today
    const todayEvents = await CalendarEvent.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      completed: false
    }).populate('babyId');
    
    for (const event of todayEvents) {
      // Check if "today" notification already exists (created today)
      const existingAlert = await Alert.findOne({
        calendarEventId: event._id,
        type: 'calendar',
        timestamp: { $gte: today }
      });
      
      if (!existingAlert) {
        const title = `Today: ${event.title}`;
        const message = event.time 
          ? `${event.title} today at ${event.time}${event.description ? ` - ${event.description}` : ''}`
          : `${event.title} today${event.description ? ` - ${event.description}` : ''}`;
        
        // Create in-app alert
        await createCalendarAlert(
          event.babyId._id,
          event._id,
          title,
          message
        );
        
        // Send push notification
        await sendPushToAllUsers(
          event.babyId._id,
          title,
          message,
          {
            type: 'calendar',
            eventId: event._id.toString(),
            babyId: event.babyId._id.toString()
          }
        );
        
        console.log(`Created today notification for event: ${event.title}`);
      }
    }
    
    return todayEvents.length;
  } catch (error) {
    console.error('Error checking today events:', error);
    throw error;
  }
};

// Check for events happening within 3 hours
export const checkImminentEvents = async () => {
  try {
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    // Find events happening in the next 3 hours that have a specific time and reminder enabled
    const imminentEvents = await CalendarEvent.find({
      date: {
        $gte: now,
        $lte: threeHoursLater
      },
      time: { $ne: null }, // Only events with specific times
      reminder: true,
      completed: false
    }).populate('babyId');
    
    for (const event of imminentEvents) {
      // Parse event time
      if (!event.time) continue;
      
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventDateTime = new Date(event.date);
      eventDateTime.setHours(hours, minutes, 0, 0);
      
      // Check if event is within 3 hours
      const timeDiff = eventDateTime - now;
      const hoursUntil = timeDiff / (1000 * 60 * 60);
      
      if (hoursUntil <= 3 && hoursUntil > 0) {
        // Check if 3-hour reminder already exists
        const last3Hours = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const existingAlert = await Alert.findOne({
          calendarEventId: event._id,
          type: 'calendar',
          timestamp: { $gte: last3Hours },
          message: { $regex: /in \d+ hour/ } // Look for "in X hours" messages
        });
        
        if (!existingAlert) {
          const hoursRounded = Math.ceil(hoursUntil);
          const title = hoursRounded === 1 
            ? `Soon: ${event.title}`
            : `In ${hoursRounded} hours: ${event.title}`;
          const message = `${event.title} at ${event.time}${event.description ? ` - ${event.description}` : ''}`;
          
          // Create in-app alert
          await createCalendarAlert(
            event.babyId._id,
            event._id,
            title,
            message
          );
          
          // Send push notification
          await sendPushToAllUsers(
            event.babyId._id,
            title,
            message,
            {
              type: 'calendar_imminent',
              eventId: event._id.toString(),
              babyId: event.babyId._id.toString()
            }
          );
          
          console.log(`Created imminent notification for event: ${event.title} (in ${hoursRounded}h)`);
        }
      }
    }
    
    return imminentEvents.length;
  } catch (error) {
    console.error('Error checking imminent events:', error);
    throw error;
  }
};

// Manual trigger to check events (can be called from API endpoint)
export const triggerEventCheck = async () => {
  const upcomingCount = await checkUpcomingEvents();
  const todayCount = await checkTodayEvents();
  const imminentCount = await checkImminentEvents();
  
  return {
    upcomingNotifications: upcomingCount,
    todayNotifications: todayCount,
    imminentNotifications: imminentCount
  };
};

// Start periodic checking (runs every hour)
export const startEventCheckScheduler = () => {
  // Run immediately on start
  checkUpcomingEvents().catch(console.error);
  checkTodayEvents().catch(console.error);
  checkImminentEvents().catch(console.error);
  
  // Run every hour
  setInterval(() => {
    checkUpcomingEvents().catch(console.error);
    checkTodayEvents().catch(console.error);
    checkImminentEvents().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
  
  console.log('Calendar event notification scheduler started (checks: 1 day before, today, and 3 hours before)');
};

/**
 * Get all users that can access a baby (parent + linked users)
 */
async function getAllUsersThatCanAccess(babyId) {
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
 * Send push notifications to all users who have access to a baby
 */
async function sendPushToAllUsers(babyId, title, body, data = {}) {
  try {
    const users = await getAllUsersThatCanAccess(babyId);
    
    for (const user of users) {
      if (user.pushToken) {
        await sendPushNotification(
          user.pushToken,
          title,
          body,
          data
        );
      }
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}
