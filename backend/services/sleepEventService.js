import SleepEvent from '../models/SleepEvent.js';

class SleepEventService {
    /**
     * Get all sleep events for a specific device
     */
    static async getSleepEventsByDevice(deviceId) {
        return SleepEvent.find({ device_id: deviceId })
            .sort({ start_time: -1 });
    }

    /**
     * Get recent sleep sessions (completed sleep events)
     * @param {string} deviceId - The device ID
     * @param {number} limit - Number of sessions to return
     */
    static async getRecentSleepSessions(deviceId, limit = 10) {
        return SleepEvent.find({ 
            device_id: deviceId,
            status: { $in: ["Somn Incheiat", "Finalizat"] },
            duration_minutes: { $gt: 0 }
        })
            .sort({ end_time: -1 })
            .limit(limit);
    }

    /**
     * Get the last completed sleep session
     */
    static async getLastSleepSession(deviceId) {
        return SleepEvent.findOne({ 
            device_id: deviceId,
            status: { $in: ["Somn Incheiat", "Finalizat"] },
            duration_minutes: { $gt: 0 }
        })
            .sort({ end_time: -1 });
    }

    /**
     * Get current sleep session (if baby is sleeping)
     */
    static async getCurrentSleepSession(deviceId) {
        return SleepEvent.findOne({ 
            device_id: deviceId,
            status: "Somn Inceput"
        })
            .sort({ start_time: -1 });
    }

    /**
     * Get sleep events within a date range
     */
    static async getSleepEventsByDateRange(deviceId, startDate, endDate) {
        return SleepEvent.find({
            device_id: deviceId,
            start_time: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
            .sort({ start_time: -1 });
    }

    /**
     * Get sleep statistics for today
     */
    static async getTodaySleepStats(deviceId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessions = await SleepEvent.find({
            device_id: deviceId,
            status: { $in: ["Somn Incheiat", "Finalizat"] },
            end_time: {
                $gte: today,
                $lt: tomorrow
            }
        });

        const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
        const sessionCount = sessions.length;

        return {
            totalMinutes,
            totalHours: Math.floor(totalMinutes / 60),
            remainingMinutes: Math.round(totalMinutes % 60),
            sessionCount,
            sessions
        };
    }
}

export default SleepEventService;
