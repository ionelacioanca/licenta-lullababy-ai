import mongoose from 'mongoose';

const soundSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    default: 'Unknown'
  },
  category: {
    type: String,
    required: true,
    enum: ['lullaby', 'white-noise', 'nature', 'music-box', 'classical'],
    default: 'lullaby'
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: true // Default sounds are pre-seeded
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster category queries
soundSchema.index({ category: 1 });
soundSchema.index({ isDefault: 1 });

const Sound = mongoose.model('Sound', soundSchema);

export default Sound;
