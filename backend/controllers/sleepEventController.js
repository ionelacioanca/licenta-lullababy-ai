import SleepEventService from '../services/sleepEventService.js';

class SleepEventController {
    /**
     * Get all sleep events for a device
     */
    static async getSleepEventsByDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const events = await SleepEventService.getSleepEventsByDevice(deviceId);
            res.status(200).json(events);
        } catch (error) {
            console.error('Error fetching sleep events:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get recent sleep sessions
     */
    static async getRecentSleepSessions(req, res) {
        try {
            const { deviceId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const sessions = await SleepEventService.getRecentSleepSessions(deviceId, limit);
            res.status(200).json(sessions);
        } catch (error) {
            console.error('Error fetching recent sleep sessions:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get last sleep session
     */
    static async getLastSleepSession(req, res) {
        try {
            const { deviceId } = req.params;
            const session = await SleepEventService.getLastSleepSession(deviceId);
            
            if (!session) {
                return res.status(404).json({ message: 'No sleep session found' });
            }
            
            res.status(200).json(session);
        } catch (error) {
            console.error('Error fetching last sleep session:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get current sleep session (if baby is sleeping)
     */
    static async getCurrentSleepSession(req, res) {
        try {
            const { deviceId } = req.params;
            const session = await SleepEventService.getCurrentSleepSession(deviceId);
            
            if (!session) {
                return res.status(200).json({ sleeping: false, session: null });
            }
            
            res.status(200).json({ sleeping: true, session });
        } catch (error) {
            console.error('Error fetching current sleep session:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get sleep events by date range
     */
    static async getSleepEventsByDateRange(req, res) {
        try {
            const { deviceId } = req.params;
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start date and end date are required' });
            }
            
            const events = await SleepEventService.getSleepEventsByDateRange(deviceId, startDate, endDate);
            res.status(200).json(events);
        } catch (error) {
            console.error('Error fetching sleep events by date range:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get today's sleep statistics
     */
    static async getTodaySleepStats(req, res) {
        try {
            const { deviceId } = req.params;
            const stats = await SleepEventService.getTodaySleepStats(deviceId);
            res.status(200).json(stats);
        } catch (error) {
            console.error('Error fetching today sleep stats:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

export default SleepEventController;
