import express from 'express';
import * as growthController from '../controllers/growthController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Add a new growth record
router.post('/baby/:babyId', growthController.addGrowthRecord);

// Get all growth records for a baby
router.get('/baby/:babyId', growthController.getGrowthRecords);

// Get the latest growth record for a baby
router.get('/baby/:babyId/latest', growthController.getLatestGrowthRecord);

// Get growth statistics for a baby
router.get('/baby/:babyId/stats', growthController.getGrowthStats);

// Update a growth record
router.put('/:recordId', growthController.updateGrowthRecord);

// Delete a growth record
router.delete('/:recordId', growthController.deleteGrowthRecord);

export default router;
