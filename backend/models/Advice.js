import mongoose from "mongoose";

const adviceSchema = new mongoose.Schema({
   ageRange: {
       type: String,
       required: true
   },
   topic: {
       type: String
   },
   content: {
       type: String
   }
}, {timestamps: true});
const Advice = mongoose.model("Advice", adviceSchema);
export default Advice;


