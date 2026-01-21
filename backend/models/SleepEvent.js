import mongoose from "mongoose";

const sleepEventSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["Somn Inceput", "Somn Incheiat", "Finalizat"],
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    duration_minutes: {
        type: Number,
        default: 0
    },
    device_id: {
        type: String,
        required: true
    }
}, { 
    timestamps: true,
    collection: 'sleep_events' 
});

const SleepEvent = mongoose.model("SleepEvent", sleepEventSchema);
export default SleepEvent;
