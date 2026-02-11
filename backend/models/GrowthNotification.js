import mongoose from 'mongoose';

const growthNotificationSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['weight_check', 'growth_measurement'],
    default: 'growth_measurement'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'dismissed', 'completed'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // In-app notification details
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Additional metadata
  ageInMonths: {
    type: Number,
    required: true
  },
  nextScheduledDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
growthNotificationSchema.index({ babyId: 1, scheduledDate: 1 });
growthNotificationSchema.index({ userId: 1, status: 1 });
growthNotificationSchema.index({ scheduledDate: 1, status: 1 });
growthNotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model('GrowthNotification', growthNotificationSchema);
