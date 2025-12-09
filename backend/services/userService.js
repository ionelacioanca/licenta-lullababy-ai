import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserService {
    static createUser(userModel) {
        const user = new User(userModel);
        return user.save();
    }

    static async getAllUsers() {
        return User.find();
    }

    static async getUserById(userId) {
        return User.findById(userId);
    }

    static updateUser(userId, userModel) {
        return User.findByIdAndUpdate(userId, userModel, { new: true });
    }

    static deleteUser(userId) {
        return User.findByIdAndDelete(userId);
    }

    static async updateProfilePicture(userId, profilePicturePath) {
        const user = await User.findById(userId);
        
        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        return User.findByIdAndUpdate(
            userId,
            { profilePicture: profilePicturePath },
            { new: true }
        );
    }

    static async deleteProfilePicture(userId) {
        const user = await User.findById(userId);
        
        // Delete profile picture file if exists
        if (user.profilePicture) {
            const picturePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(picturePath)) {
                fs.unlinkSync(picturePath);
            }
        }

        return User.findByIdAndUpdate(
            userId,
            { profilePicture: null },
            { new: true }
        );
    }
}

export default UserService;