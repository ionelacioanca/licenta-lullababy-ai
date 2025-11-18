import {
  addCalendarEvent,
  getCalendarEvents,
  getUpcomingEvents,
  getEventsByMonth,
  updateCalendarEvent,
  markEventCompleted,
  deleteCalendarEvent,
  generateVaccinationSchedule,
  generateMilestoneSchedule,
  getEventsForReminder
} from '../services/calendarService.js';

// Add a calendar event
export const addEvent = async (req, res) => {
  try {
    const { babyId, title, description, date, time, type, reminder, reminderDays, notes } = req.body;

    if (!babyId || !title || !date || !type) {
      return res.status(400).json({ message: 'Baby ID, title, date, and type are required' });
    }

    const eventData = {
      babyId,
      title,
      description,
      date,
      time,
      type,
      reminder: reminder || false,
      reminderDays: reminderDays || 1,
      notes
    };

    const event = await addCalendarEvent(eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).json({ message: 'Failed to add calendar event', error: error.message });
  }
};

// Get all events for a baby (optionally filtered by date range)
export const getEvents = async (req, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    const events = await getCalendarEvents(babyId, startDate, endDate);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Failed to fetch calendar events', error: error.message });
  }
};

// Get upcoming events
export const getUpcoming = async (req, res) => {
  try {
    const { babyId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const events = await getUpcomingEvents(babyId, limit);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events', error: error.message });
  }
};

// Get events for a specific month
export const getMonthEvents = async (req, res) => {
  try {
    const { babyId, year, month } = req.params;

    const events = await getEventsByMonth(babyId, parseInt(year), parseInt(month));
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching month events:', error);
    res.status(500).json({ message: 'Failed to fetch month events', error: error.message });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await updateCalendarEvent(eventId, updates);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Failed to update calendar event', error: error.message });
  }
};

// Mark event as completed/uncompleted
export const toggleCompleted = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { completed } = req.body;

    const event = await markEventCompleted(eventId, completed);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error marking event:', error);
    res.status(500).json({ message: 'Failed to mark event', error: error.message });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    await deleteCalendarEvent(eventId);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Failed to delete calendar event', error: error.message });
  }
};

// Generate vaccination schedule for a baby
export const generateVaccinations = async (req, res) => {
  try {
    const { babyId } = req.params;

    const count = await generateVaccinationSchedule(babyId);
    res.status(200).json({ 
      message: `Vaccination schedule generated successfully`,
      eventsCreated: count
    });
  } catch (error) {
    console.error('Error generating vaccination schedule:', error);
    res.status(500).json({ message: 'Failed to generate vaccination schedule', error: error.message });
  }
};

// Generate milestone schedule for a baby
export const generateMilestones = async (req, res) => {
  try {
    const { babyId } = req.params;

    const count = await generateMilestoneSchedule(babyId);
    res.status(200).json({ 
      message: `Milestone schedule generated successfully`,
      eventsCreated: count
    });
  } catch (error) {
    console.error('Error generating milestone schedule:', error);
    res.status(500).json({ message: 'Failed to generate milestone schedule', error: error.message });
  }
};

// Get events that need reminders
export const getReminders = async (req, res) => {
  try {
    const { babyId } = req.params;

    const events = await getEventsForReminder(babyId);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
};
