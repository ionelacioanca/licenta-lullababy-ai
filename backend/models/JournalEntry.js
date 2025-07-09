import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema({
   babyId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Baby",
       required: true
   },
   entryDate: {
       type: Date,
       default: Date.now,
   },
   content: {
       type: String,
       required: true
   }
}, {timestamps: true});
const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
export default JournalEntry;



