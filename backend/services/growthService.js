import GrowthRecord from '../models/GrowthRecord.js';
import Baby from '../models/Baby.js';

class GrowthService {
  // Add a new growth record
  async addGrowthRecord(babyId, weight, length, notes = '') {
    try {
      // Verify baby exists
      const baby = await Baby.findById(babyId);
      if (!baby) {
        throw new Error('Baby not found');
      }

      // Calculate age from birth date
      const birthDate = new Date(baby.birthDate);
      const now = new Date();
      const ageInMonths = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30));
      
      let age;
      if (ageInMonths === 0) {
        age = 'Birth';
      } else if (ageInMonths === 1) {
        age = '1 month';
      } else {
        age = `${ageInMonths} months`;
      }

      const growthRecord = new GrowthRecord({
        babyId,
        weight,
        length,
        age,
        notes
      });

      await growthRecord.save();
      return growthRecord;
    } catch (error) {
      throw new Error(`Error adding growth record: ${error.message}`);
    }
  }

  // Get all growth records for a baby
  async getGrowthRecords(babyId) {
    try {
      const records = await GrowthRecord.find({ babyId })
        .sort({ date: -1 })
        .lean();
      
      return records;
    } catch (error) {
      throw new Error(`Error fetching growth records: ${error.message}`);
    }
  }

  // Get the latest growth record for a baby
  async getLatestGrowthRecord(babyId) {
    try {
      const record = await GrowthRecord.findOne({ babyId })
        .sort({ date: -1 })
        .lean();
      
      return record;
    } catch (error) {
      throw new Error(`Error fetching latest growth record: ${error.message}`);
    }
  }

  // Update a growth record
  async updateGrowthRecord(recordId, updates) {
    try {
      const record = await GrowthRecord.findByIdAndUpdate(
        recordId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!record) {
        throw new Error('Growth record not found');
      }

      return record;
    } catch (error) {
      throw new Error(`Error updating growth record: ${error.message}`);
    }
  }

  // Delete a growth record
  async deleteGrowthRecord(recordId) {
    try {
      const record = await GrowthRecord.findByIdAndDelete(recordId);
      
      if (!record) {
        throw new Error('Growth record not found');
      }

      return record;
    } catch (error) {
      throw new Error(`Error deleting growth record: ${error.message}`);
    }
  }

  // Get growth statistics for a baby
  async getGrowthStats(babyId) {
    try {
      const records = await GrowthRecord.find({ babyId })
        .sort({ date: 1 })
        .lean();

      if (records.length === 0) {
        return null;
      }

      const latest = records[records.length - 1];
      const first = records[0];

      const totalWeightGain = latest.weight - first.weight;
      const totalLengthGain = latest.length - first.length;

      return {
        currentWeight: latest.weight,
        currentLength: latest.length,
        totalWeightGain,
        totalLengthGain,
        recordCount: records.length,
        firstRecord: first.date,
        latestRecord: latest.date
      };
    } catch (error) {
      throw new Error(`Error calculating growth stats: ${error.message}`);
    }
  }
}

export default new GrowthService();
