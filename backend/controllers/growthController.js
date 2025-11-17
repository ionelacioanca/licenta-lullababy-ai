import growthService from '../services/growthService.js';

// Add a new growth record
const addGrowthRecord = async (req, res) => {
  try {
    const { babyId } = req.params;
    const { weight, length, notes } = req.body;

    if (!weight || !length) {
      return res.status(400).json({ 
        message: 'Weight and length are required' 
      });
    }

    const record = await growthService.addGrowthRecord(
      babyId,
      parseFloat(weight),
      parseFloat(length),
      notes
    );

    res.status(201).json({
      message: 'Growth record added successfully',
      data: record
    });
  } catch (error) {
    console.error('Error adding growth record:', error);
    res.status(500).json({ 
      message: 'Error adding growth record',
      error: error.message 
    });
  }
};

// Get all growth records for a baby
const getGrowthRecords = async (req, res) => {
  try {
    const { babyId } = req.params;

    const records = await growthService.getGrowthRecords(babyId);

    res.status(200).json({
      message: 'Growth records retrieved successfully',
      data: records
    });
  } catch (error) {
    console.error('Error fetching growth records:', error);
    res.status(500).json({ 
      message: 'Error fetching growth records',
      error: error.message 
    });
  }
};

// Get the latest growth record for a baby
const getLatestGrowthRecord = async (req, res) => {
  try {
    const { babyId } = req.params;

    const record = await growthService.getLatestGrowthRecord(babyId);

    if (!record) {
      return res.status(404).json({ 
        message: 'No growth records found for this baby' 
      });
    }

    res.status(200).json({
      message: 'Latest growth record retrieved successfully',
      data: record
    });
  } catch (error) {
    console.error('Error fetching latest growth record:', error);
    res.status(500).json({ 
      message: 'Error fetching latest growth record',
      error: error.message 
    });
  }
};

// Update a growth record
const updateGrowthRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const updates = req.body;

    const record = await growthService.updateGrowthRecord(recordId, updates);

    res.status(200).json({
      message: 'Growth record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating growth record:', error);
    res.status(500).json({ 
      message: 'Error updating growth record',
      error: error.message 
    });
  }
};

// Delete a growth record
const deleteGrowthRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    await growthService.deleteGrowthRecord(recordId);

    res.status(200).json({
      message: 'Growth record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting growth record:', error);
    res.status(500).json({ 
      message: 'Error deleting growth record',
      error: error.message 
    });
  }
};

// Get growth statistics for a baby
const getGrowthStats = async (req, res) => {
  try {
    const { babyId } = req.params;

    const stats = await growthService.getGrowthStats(babyId);

    if (!stats) {
      return res.status(404).json({ 
        message: 'No growth records found for this baby' 
      });
    }

    res.status(200).json({
      message: 'Growth statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching growth statistics:', error);
    res.status(500).json({ 
      message: 'Error fetching growth statistics',
      error: error.message 
    });
  }
};

export {
  addGrowthRecord,
  getGrowthRecords,
  getLatestGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
  getGrowthStats
};
