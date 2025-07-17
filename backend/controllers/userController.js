import userService from '../services/userService.js';
import jwt from 'jsonwebtoken';

class UserController {
  static async createUser(userModel) {
    await userService.createUser(userModel);
  }

  static async getAllUsers() {
    return await userService.getAllUsers();
  }

  static async getUserById(userId) {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  static async updateUser(userId, userModel) {
    const updatedUser = await userService.updateUser(userId, userModel);
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  static async deleteUser(userId) {
    const deletedUser = await userService.deleteUser(userId);
    if (!deletedUser) throw new Error('User not found');
    return deletedUser;
  }

  // ✅ Metoda de login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userService.authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // ✅ Aici trimitem `parentId` = `user._id`
      res.status(200).json({
        token,
        name: user.name,
        parentId: user._id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

export default UserController;
