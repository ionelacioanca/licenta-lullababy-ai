import User from '../models/User.js';

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
}

export default UserService;