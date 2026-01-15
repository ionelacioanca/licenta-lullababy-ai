import express from 'express';
import * as soundController from '../controllers/soundController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/sounds - Get all sounds
router.get('/', soundController.getAllSounds);

// GET /api/sounds/default - Get only default sounds
router.get('/default', soundController.getDefaultSounds);

// GET /api/sounds/category/:category - Get sounds by category
router.get('/category/:category', soundController.getSoundsByCategory);

// GET /api/sounds/:id/local-url - Get local URL for Raspberry Pi (must be before /:id)
router.get('/:id/local-url', soundController.getLocalUrl);

// GET /api/sounds/:id - Get sound by ID
router.get('/:id', soundController.getSoundById);

// POST /api/sounds - Create a new sound (for future custom uploads)
router.post('/', soundController.createSound);

export default router;
