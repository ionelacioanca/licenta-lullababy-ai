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
    },
    resetCode: {
        type: String
    },
    resetCodeExpiry: {
        type: Number
    }
}, {timestamps: true});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    
    // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
        return next(); // Already hashed, skip
    }
    
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

const User = mongoose.model("User", userSchema);
export default User;
