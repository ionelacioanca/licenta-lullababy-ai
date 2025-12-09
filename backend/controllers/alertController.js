import Alert from '../models/Alert.js';
import Baby from '../models/Baby.js';

// Get all alerts for a baby
export const getAlertsByBaby = async (req, res) => {
  try {
    const { babyId } = req.params;
    
    const alerts = await Alert.find({ babyId })
      .populate('calendarEventId')
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

// Get unread alert count for a baby
export const getUnreadCount = async (req, res) => {
  try {
    const { babyId } = req.params;
    
    const count = await Alert.countDocuments({ 
      babyId, 
      isRead: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread alerts:', error);
    res.status(500).json({ message: 'Failed to count alerts' });
  }
};

// Mark alert as read
export const markAsRead = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { isRead: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Failed to update alert' });
  }
};

// Mark all alerts as read for a baby
export const markAllAsRead = async (req, res) => {
  try {
    const { babyId } = req.params;
    
    await Alert.updateMany(
      { babyId, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Error marking alerts as read:', error);
    res.status(500).json({ message: 'Failed to update alerts' });
  }
};

// Delete an alert
export const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await Alert.findByIdAndDelete(alertId);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Failed to delete alert' });
  }
};

// Create a calendar reminder alert
export const createCalendarAlert = async (babyId, calendarEventId, title, message) => {
  try {
    const alert = await Alert.create({
      babyId,
      calendarEventId,
      type: 'calendar',
      title,
      message,
      isRead: false
    });
    
    return alert;
  } catch (error) {
    console.error('Error creating calendar alert:', error);
    throw error;
  }
};
