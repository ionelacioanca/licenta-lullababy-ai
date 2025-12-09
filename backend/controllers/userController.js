import UserService from '../services/userService.js';
import jwt from 'jsonwebtoken';

class UserController {
  static async createUser(userModel) {
    await UserService.createUser(userModel);
  }

  static async getAllUsers() {
    return await UserService.getAllUsers();
  }

  static async getUserById(userId) {
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  static async updateUser(userId, userModel) {
    const updatedUser = await UserService.updateUser(userId, userModel);
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  static async deleteUser(userId) {
    const deletedUser = await UserService.deleteUser(userId);
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

  // Upload profile picture
  static async uploadProfilePicture(req, res) {
    try {
      console.log('Upload profile picture request received');
      const userId = req.user.userId;
      console.log('User ID:', userId);
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File received:', req.file.filename);
      const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await UserService.updateProfilePicture(userId, profilePicturePath);

      console.log('Profile picture updated successfully');
      res.status(200).json({
        message: 'Profile picture uploaded successfully',
        profilePicture: updatedUser.profilePicture
      });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  // Delete profile picture
  static async deleteProfilePicture(req, res) {
    try {
      console.log('Delete profile picture request received');
      const userId = req.user.userId;
      const updatedUser = await UserService.deleteProfilePicture(userId);

      console.log('Profile picture deleted successfully');
      res.status(200).json({
        message: 'Profile picture deleted successfully',
        profilePicture: null
      });
    } catch (err) {
      console.error('Error deleting profile picture:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
}

export default UserController;
