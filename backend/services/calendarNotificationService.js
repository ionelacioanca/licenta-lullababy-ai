import CalendarEvent from '../models/CalendarEvent.js';
import Alert from '../models/Alert.js';
import { createCalendarAlert } from '../controllers/alertController.js';

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
      // Check if notification already exists for this event
      const existingAlert = await Alert.findOne({
        calendarEventId: event._id,
        type: 'calendar'
      });
      
      if (!existingAlert) {
        // Create notification
        const title = `Upcoming: ${event.title}`;
        const message = event.time 
          ? `${event.title} tomorrow at ${event.time}${event.description ? ` - ${event.description}` : ''}`
          : `${event.title} tomorrow${event.description ? ` - ${event.description}` : ''}`;
        
        await createCalendarAlert(
          event.babyId._id,
          event._id,
          title,
          message
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
      // Check if "today" notification already exists
      const existingAlert = await Alert.findOne({
        calendarEventId: event._id,
        type: 'calendar',
        message: { $regex: /^Today:/ }
      });
      
      if (!existingAlert) {
        const title = `Today: ${event.title}`;
        const message = event.time 
          ? `${event.title} today at ${event.time}${event.description ? ` - ${event.description}` : ''}`
          : `${event.title} today${event.description ? ` - ${event.description}` : ''}`;
        
        await createCalendarAlert(
          event.babyId._id,
          event._id,
          title,
          message
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

// Manual trigger to check events (can be called from API endpoint)
export const triggerEventCheck = async () => {
  const upcomingCount = await checkUpcomingEvents();
  const todayCount = await checkTodayEvents();
  
  return {
    upcomingNotifications: upcomingCount,
    todayNotifications: todayCount
  };
};

// Start periodic checking (runs every hour)
export const startEventCheckScheduler = () => {
  // Run immediately on start
  checkUpcomingEvents().catch(console.error);
  checkTodayEvents().catch(console.error);
  
  // Run every hour
  setInterval(() => {
    checkUpcomingEvents().catch(console.error);
    checkTodayEvents().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
  
  console.log('Calendar event notification scheduler started');
};
