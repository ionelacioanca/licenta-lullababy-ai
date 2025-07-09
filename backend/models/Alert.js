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
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});
const Alert = mongoose.model("Alert", alertSchema);
export default Alert;

