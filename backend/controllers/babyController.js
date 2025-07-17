import babyService from '../services/babyService.js';

class babyController {

    static async createBaby(babyModel) {
    const baby = await babyService.createBaby(babyModel);
    return baby;
}

    static async getAllBabies() {
        const babies = await babyService.getAllBabies();
        return babies;
    }

    static async getBabyById(babyId) {
        const baby = await babyService.getBabyById(babyId);
        if (!baby) {
            throw new Error('Baby not found');
        }
        return baby;
    }

    static async updateBaby(babyId, babyModel) {
        const updatedBaby = await babyService.updateBaby(babyId, babyModel);
        if (!updatedBaby) {
            throw new Error('Baby not found');
        }
        return updatedBaby;
    }

    static async deleteBaby(babyId) {
        const deletedBaby = await babyService.deleteBaby(babyId);
        if (!deletedBaby) {
            throw new Error('Baby not found');
        }
        return deletedBaby;
    }

    static async getBabiesByParentId(parentId) {
        const babies = await babyService.getBabiesByParentId(parentId);
        if (!babies || babies.length === 0) {
            throw new Error('No babies found for this parent.');
        }
        return babies;
    }
}

export default babyController;
