import mongoose from "mongoose";

const babySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        enum: ['Girl', 'Boy'],
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    birthTime: {
        type: String
    },
    birthWeight: {
        type: Number
    },
    birthLength: {
        type: Number
    },
    birthType: {
        type: String,
        enum: ['Natural', 'C-Section']
    },
    gestationalWeeks: {
        type: Number
    },
    knownAllergies: {
        type: String
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true});
const Baby = mongoose.model("Baby", babySchema);
export default Baby;

