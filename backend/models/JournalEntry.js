import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema({
   babyId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Baby",
       required: true
   },
   title: {
       type: String,
       trim: true,
       maxlength: 100
   },
   description: {
       type: String,
       required: true,
       trim: true
   },
   date: {
       type: Date,
       default: Date.now,
       required: true
   },
   photos: [{
       type: String, // URL to photo
   }],
   photoCaptions: [{
       type: String,
       trim: true
   }],
   tags: [{
       type: String,
       enum: ['milestone', 'first-moments', 'sleep', 'feeding', 'health', 'challenges', 'playtime', 'other'],
   }],
   mood: {
       type: String,
       enum: ['happy', 'okay', 'neutral', 'crying', 'sick'],
       default: 'neutral'
   }
}, {timestamps: true});

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
export default JournalEntry;



