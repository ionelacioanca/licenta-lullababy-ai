import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
    babyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Baby",
        required: true
    },
    vitalDataId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VitalData",
        required: false // Made optional for calendar notifications
    },
    calendarEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CalendarEvent",
        required: false
    },
    type: {
        type: String,
        enum: ['vital', 'calendar', 'system'],
        default: 'vital'
    },
    message: {
        type: String,
        required: true
    },
    title: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});
const Alert = mongoose.model("Alert", alertSchema);
export default Alert;

