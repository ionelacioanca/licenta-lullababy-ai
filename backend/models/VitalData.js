import mongoose from "mongoose";

const vitalDataSchema = new mongoose.Schema({
    babyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Baby",
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    heartRate: Number,
    temperature: Number,
    spo2: Number,
    cryingLevel: Number,
    sleepActivity: Number,
    movementActivity: Number
}, {timestamps: true});
const VitalData = mongoose.model("VitalData", vitalDataSchema);
export default VitalData;

