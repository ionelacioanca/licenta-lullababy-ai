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
            // Get the current user
            const currentUser = await User.findById(parentId);
            
            // Array to store parent IDs to fetch babies from
            const parentIds = [parentId];
            
            if (currentUser) {
                // For nanny: add all linked parents from relatedParentIds array
                if (currentUser.role === 'nanny' && currentUser.relatedParentIds && currentUser.relatedParentIds.length > 0) {
                    parentIds.push(...currentUser.relatedParentIds);
                }
                // For mother/father/others: add single linked parent
                else if (currentUser.relatedParentId) {
                    parentIds.push(currentUser.relatedParentId);
                }
            }
            
            // Fetch babies from all parent IDs
            return BabyModel.find({ parentId: { $in: parentIds } });
        } catch (error) {
            console.error('Error in getBabiesByParentId:', error);
            throw error;
        }
    }
}

export default BabyService;
