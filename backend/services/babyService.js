import BabyModel from '../models/Baby.js';
import User from '../models/User.js';

class BabyService {
    static createBaby(babyData) {
        const baby = new BabyModel(babyData);
        return baby.save();
    }

    static async getAllBabies() {
        return BabyModel.find();
    }

    static async getBabyById(babyId) {
        return BabyModel.findById(babyId);
    }

    static updateBaby(babyId, babyData) {
        return BabyModel.findByIdAndUpdate(babyId, babyData, { new: true });
    }

    static deleteBaby(babyId) {
        return BabyModel.findByIdAndDelete(babyId);
    }

    static async getBabiesByParentId(parentId) {
        try {
            // Get the current parent
            const currentParent = await User.findById(parentId);
            
            // Array to store parent IDs to fetch babies from
            const parentIds = [parentId];
            
            // If parent has a linked parent, add their ID too
            if (currentParent && currentParent.relatedParentId) {
                parentIds.push(currentParent.relatedParentId);
            }
            
            // Fetch babies from both parents
            return BabyModel.find({ parentId: { $in: parentIds } });
        } catch (error) {
            console.error('Error in getBabiesByParentId:', error);
            throw error;
        }
    }
}

export default BabyService;
