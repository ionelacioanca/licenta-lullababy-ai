import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["mother", "father", "nanny", "others"],
        required: true
    }
}, {timestamps: true});

userSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next(); 
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

const User = mongoose.model("User", userSchema);
export default User;
