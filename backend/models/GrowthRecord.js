import mongoose from 'mongoose';

const growthRecordSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  length: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  age: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
growthRecordSchema.index({ babyId: 1, date: -1 });

export default mongoose.model('GrowthRecord', growthRecordSchema);
