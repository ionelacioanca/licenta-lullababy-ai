import express from 'express';
import SleepEventController from '../controllers/sleepEventController.js';

const sleepEventRouter = express.Router();

// Get all sleep events for a device
sleepEventRouter.get('/device/:deviceId', SleepEventController.getSleepEventsByDevice);

// Get recent sleep sessions (completed)
sleepEventRouter.get('/device/:deviceId/recent', SleepEventController.getRecentSleepSessions);

// Get last sleep session
sleepEventRouter.get('/device/:deviceId/last', SleepEventController.getLastSleepSession);

// Get current sleep session (if baby is sleeping)
sleepEventRouter.get('/device/:deviceId/current', SleepEventController.getCurrentSleepSession);

// Get sleep events by date range
sleepEventRouter.get('/device/:deviceId/range', SleepEventController.getSleepEventsByDateRange);

// Get sleep events by baby ID and date range
sleepEventRouter.get('/baby/:babyId/range', SleepEventController.getSleepEventsByBabyAndDateRange);

// Get current sleep session for a specific baby
sleepEventRouter.get('/baby/:babyId/current', SleepEventController.getCurrentSleepSessionByBaby);

// Get last sleep session for a specific baby
sleepEventRouter.get('/baby/:babyId/last', SleepEventController.getLastSleepSessionByBaby);

// Get today's sleep statistics
sleepEventRouter.get('/device/:deviceId/today', SleepEventController.getTodaySleepStats);

export default sleepEventRouter;
