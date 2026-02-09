import express from 'express';
import User from '../models/User.js';
import Baby from '../models/Baby.js';
import Alert from '../models/Alert.js';
import LinkRequest from '../models/LinkRequest.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

const router = express.Router();

// Helper function to get all babies accessible to a user (own + linked)
async function getAllUserBabies(userId) {
    try {
        // Get user's own babies
        const ownBabies = await Baby.find({ parentId: userId });
        
        // Get babies from accepted link requests where user is the requester
        const acceptedLinks = await LinkRequest.find({ 
            requesterId: userId, 
            status: 'accepted' 
        }).populate('parentId');
        
        // Get babies from those linked parents
        const linkedBabies = [];
        for (const link of acceptedLinks) {
            const babies = await Baby.find({ parentId: link.parentId });
            linkedBabies.push(...babies);
        }
        
        // Combine and deduplicate
        const allBabies = [...ownBabies, ...linkedBabies];
        const uniqueBabies = Array.from(
            new Map(allBabies.map(baby => [baby._id.toString(), baby])).values()
        );
        
        return uniqueBabies;
    } catch (error) {
        console.error('Error getting user babies:', error);
        return [];
    }
}

// POST /api/notifications/motion-detected
router.post('/motion-detected', async (req, res) => {
    try {
        console.log('🔔 [NOTIFICATION] Motion detected notification received');
        
        // Find all users with push tokens
        const users = await User.find({ pushToken: { $exists: true, $ne: null } });
        console.log(`🔔 [NOTIFICATION] Found users: ${users.length}`);
        
        if (users.length === 0) {
            return res.status(200).json({ message: 'No users with push tokens found' });
        }
        
        console.log(`🔔 [NOTIFICATION] Sending to ${users.length} user(s)`);
        
        // For each user, create alerts for ALL their accessible babies
        const allAlertPromises = users.map(async (user) => {
            console.log(`📊 [NOTIFICATION] Processing user: ${user._id}, email: ${user.email}`);
            
            // Get all babies accessible to this user
            console.log(`🔍 [NOTIFICATION] Finding all accessible babies for user: ${user._id}`);
            const allBabies = await getAllUserBabies(user._id);
            console.log(`🔍 [NOTIFICATION] Found ${allBabies.length} accessible babies`);
            
            if (allBabies.length === 0) {
                console.log(`⚠️ [NOTIFICATION] No babies found for user ${user._id}`);
                return [];
            }
            
            // Create alerts for ALL accessible babies
            const babyAlerts = allBabies.map(async (userBaby) => {
                console.log(`✅ [NOTIFICATION] Creating alert for baby: ${userBaby.name} (${userBaby._id})`);
                const alert = await Alert.create({
                    babyId: userBaby._id,
                    type: 'system',
                    title: '🚼 Motion Detected',
                    message: `${userBaby.name} is moving! Check the baby monitor.`,
                    severity: 'info',
                    isRead: false,
                    timestamp: new Date()
                });
                console.log(`✅ [NOTIFICATION] Alert created with ID: ${alert._id}`);
                return alert;
            });
            
            return Promise.all(babyAlerts);
        });
        
        await Promise.all(allAlertPromises);
        console.log(`📊 [NOTIFICATION] All alerts processed`);
        
        // Send push notifications
        const pushPromises = users.map(async (user) => {
            try {
                const result = await sendPushNotification(
                    user.pushToken,
                    '🚼 Motion Detected',
                    'Your baby is moving! Check the monitor.',
                    { type: 'motion-detected' }
                );
                
                console.log('Push notification result:', result);
                return result;
            } catch (error) {
                console.error(`Error sending push to user ${user._id}:`, error);
                return null;
            }
        });
        
        await Promise.all(pushPromises);
        console.log('✅ [NOTIFICATION] Notifications sent successfully');
        
        res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
        console.error('❌ [NOTIFICATION] Error processing notification:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

// POST /api/notifications/baby-woke-up
router.post('/baby-woke-up', async (req, res) => {
    try {
        console.log('🔔 [NOTIFICATION] Baby woke up notification received');
        
        const users = await User.find({ pushToken: { $exists: true, $ne: null } });
        console.log(`🔔 [NOTIFICATION] Found users: ${users.length}`);
        
        if (users.length === 0) {
            return res.status(200).json({ message: 'No users with push tokens found' });
        }
        
        console.log(`🔔 [NOTIFICATION] Sending to ${users.length} user(s)`);
        
        const allAlertPromises = users.map(async (user) => {
            console.log(`📊 [NOTIFICATION] Processing user: ${user._id}`);
            
            const allBabies = await getAllUserBabies(user._id);
            console.log(`🔍 [NOTIFICATION] Found ${allBabies.length} accessible babies`);
            
            if (allBabies.length === 0) {
                return [];
            }
            
            const babyAlerts = allBabies.map(async (userBaby) => {
                console.log(`✅ [NOTIFICATION] Creating alert for baby: ${userBaby.name}`);
                const alert = await Alert.create({
                    babyId: userBaby._id,
                    type: 'system',
                    title: '👶 Baby Woke Up',
                    message: `${userBaby.name} just woke up!`,
                    severity: 'medium',
                    isRead: false,
                    timestamp: new Date()
                });
                return alert;
            });
            
            return Promise.all(babyAlerts);
        });
        
        await Promise.all(allAlertPromises);
        
        const pushPromises = users.map(async (user) => {
            try {
                const result = await sendPushNotification(
                    user.pushToken,
                    '👶 Baby Woke Up',
                    'Your baby just woke up!',
                    { type: 'baby-woke-up' }
                );
                
                return result;
            } catch (error) {
                console.error(`Error sending push:`, error);
                return null;
            }
        });
        
        await Promise.all(pushPromises);
        
        res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
        console.error('❌ [NOTIFICATION] Error:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

// POST /api/notifications/baby-crying
router.post('/baby-crying', async (req, res) => {
    try {
        console.log('🔔 [NOTIFICATION] Baby crying notification received');
        
        const users = await User.find({ pushToken: { $exists: true, $ne: null } });
        
        if (users.length === 0) {
            return res.status(200).json({ message: 'No users with push tokens found' });
        }
        
        const allAlertPromises = users.map(async (user) => {
            const allBabies = await getAllUserBabies(user._id);
            
            if (allBabies.length === 0) {
                return [];
            }
            
            const babyAlerts = allBabies.map(async (userBaby) => {
                const alert = await Alert.create({
                    babyId: userBaby._id,
                    type: 'system',
                    title: '😢 Baby Crying',
                    message: `${userBaby.name} is crying! Check on them.`,
                    severity: 'high',
                    isRead: false,
                    timestamp: new Date()
                });
                return alert;
            });
            
            return Promise.all(babyAlerts);
        });
        
        await Promise.all(allAlertPromises);
        
        const pushPromises = users.map(async (user) => {
            try {
                const result = await sendPushNotification(
                    user.pushToken,
                    '😢 Baby Crying',
                    'Your baby is crying! Please check on them.',
                    { type: 'baby-crying', priority: 'high' }
                );
                
                return result;
            } catch (error) {
                console.error(`Error sending push:`, error);
                return null;
            }
        });
        
        await Promise.all(pushPromises);
        
        res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
        console.error('❌ [NOTIFICATION] Error:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

export default router;
