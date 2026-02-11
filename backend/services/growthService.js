import GrowthRecord from '../models/GrowthRecord.js';
import Baby from '../models/Baby.js';

class GrowthService {
  /**
   * Evaluate growth based on WHO growth standards
   * Returns feedback message about the baby's growth
   */
  evaluateGrowth(weight, length, ageInMonths, gender = 'unknown') {
    // WHO growth standards (approximate median values)
    // These are simplified - real WHO standards use percentile charts
    const weightStandards = {
      0: { min: 2.5, median: 3.5, max: 4.5 },
      1: { min: 3.4, median: 4.5, max: 5.8 },
      2: { min: 4.3, median: 5.6, max: 7.1 },
      3: { min: 5.0, median: 6.4, max: 8.0 },
      4: { min: 5.6, median: 7.0, max: 8.7 },
      5: { min: 6.0, median: 7.5, max: 9.3 },
      6: { min: 6.4, median: 7.9, max: 9.8 },
      9: { min: 7.1, median: 8.9, max: 11.0 },
      12: { min: 7.7, median: 9.6, max: 12.0 },
      18: { min: 8.8, median: 11.0, max: 13.7 },
      24: { min: 9.7, median: 12.2, max: 15.3 },
    };

    const lengthStandards = {
      0: { min: 46, median: 50, max: 54 },
      1: { min: 50, median: 54.7, max: 59 },
      2: { min: 54, median: 58.4, max: 63 },
      3: { min: 57, median: 61.4, max: 66 },
      4: { min: 59, median: 63.9, max: 69 },
      5: { min: 61, median: 65.9, max: 71 },
      6: { min: 63, median: 67.6, max: 73 },
      9: { min: 67, median: 72.0, max: 77 },
      12: { min: 71, median: 75.7, max: 81 },
      18: { min: 76, median: 82.3, max: 89 },
      24: { min: 81, median: 87.1, max: 94 },
    };

    // Find closest age bracket
    const ages = Object.keys(weightStandards).map(Number).sort((a, b) => a - b);
    let closestAge = ages[0];
    for (const age of ages) {
      if (Math.abs(age - ageInMonths) < Math.abs(closestAge - ageInMonths)) {
        closestAge = age;
      }
    }

    const weightRef = weightStandards[closestAge];
    const lengthRef = lengthStandards[closestAge];

    // Evaluate weight
    let weightStatus = '';
    const weightKg = parseFloat(weight);
    if (weightKg < weightRef.min) {
      weightStatus = 'below normal range';
    } else if (weightKg > weightRef.max) {
      weightStatus = 'above normal range';
    } else if (weightKg >= weightRef.min && weightKg <= weightRef.median) {
      weightStatus = 'healthy';
    } else {
      weightStatus = 'healthy';
    }

    // Evaluate length
    let lengthStatus = '';
    const lengthCm = parseFloat(length);
    if (lengthCm < lengthRef.min) {
      lengthStatus = 'below normal range';
    } else if (lengthCm > lengthRef.max) {
      lengthStatus = 'above normal range';
    } else if (lengthCm >= lengthRef.min && lengthCm <= lengthRef.median) {
      lengthStatus = 'healthy';
    } else {
      lengthStatus = 'healthy';
    }

    // Generate feedback message
    let feedback = '';
    if (weightStatus === 'healthy' && lengthStatus === 'healthy') {
      feedback = '✓ Excellent! Baby\'s weight and length are within healthy range for their age.';
    } else if (weightStatus === 'healthy' && lengthStatus !== 'healthy') {
      feedback = `Weight is healthy, but length is ${lengthStatus}. Consider consulting your pediatrician.`;
    } else if (weightStatus !== 'healthy' && lengthStatus === 'healthy') {
      feedback = `Length is healthy, but weight is ${weightStatus}. Consider consulting your pediatrician.`;
    } else {
      feedback = `Both weight and length are ${weightStatus === lengthStatus ? weightStatus : 'outside normal ranges'}. Please consult your pediatrician.`;
    }

    return {
      feedback,
      weightStatus,
      lengthStatus,
      reference: {
        weight: weightRef,
        length: lengthRef,
        ageMonths: closestAge
      }
    };
  }

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
      
      // Evaluate growth and get feedback
      const evaluation = this.evaluateGrowth(weight, length, ageInMonths, baby.gender);
      
      return {
        growthRecord,
        evaluation
      };
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
