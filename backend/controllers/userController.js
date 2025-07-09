import userService from '../services/userService.js';

class UserController {

    static async createUser(userModel) {
        await userService.createUser(userModel);
    }

    static async getAllUsers() {
        const users = await userService.getAllUsers();
        return users;
    }

    static async getUserById(userId) {
        const user = await userService.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    static async updateUser(userId, userModel) {
        const updatedUser = await userService.updateUser(userId, userModel);
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    static async deleteUser(userId) {
        const deletedUser = await userService.deleteUser(userId);
        if (!deletedUser) {
            throw new Error('User not found');
        }
        return deletedUser;
    }
}

export default UserController;