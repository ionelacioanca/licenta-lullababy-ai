import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema({
   babyId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Baby",
       required: true
   },
   title: {
       type: String,
       required: true
   },
   description: {
       type: String
   },
   date: {
       type: Date,
       required: true
   }
}, {timestamps: true});
const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);
export default CalendarEvent;



