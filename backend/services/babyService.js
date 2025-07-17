import BabyModel from '../models/Baby.js'; 

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
        return BabyModel.find({ parentId: parentId });
    }
}

export default BabyService;
