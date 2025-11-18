import express from 'express';
import {
  addEvent,
  getEvents,
  getUpcoming,
  getMonthEvents,
  updateEvent,
  toggleCompleted,
  deleteEvent,
  generateVaccinations,
  generateMilestones,
  getReminders
} from '../controllers/calendarController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Event CRUD operations
router.post('/event', addEvent);
router.get('/baby/:babyId', getEvents);
router.get('/baby/:babyId/upcoming', getUpcoming);
router.get('/baby/:babyId/:year/:month', getMonthEvents);
router.put('/event/:eventId', updateEvent);
router.patch('/event/:eventId/complete', toggleCompleted);
router.delete('/event/:eventId', deleteEvent);

// Schedule generation
router.post('/baby/:babyId/generate-vaccinations', generateVaccinations);
router.post('/baby/:babyId/generate-milestones', generateMilestones);

// Reminders
router.get('/baby/:babyId/reminders', getReminders);

export default router;
