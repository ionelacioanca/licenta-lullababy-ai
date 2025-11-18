import express from "express";
import * as journalController from "../controllers/journalController.js";
import auth from "../middleware/authMiddleware.js";
import { uploadJournalPhotos } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all entries for a baby
router.get("/baby/:babyId", journalController.getEntries);

// Get recent entries for dashboard
router.get("/baby/:babyId/recent", journalController.getRecentEntries);

// Get gallery (all photos) for a baby
router.get("/baby/:babyId/gallery", journalController.getGallery);

// Get single entry
router.get("/:id", journalController.getEntry);

// Create new entry (with photo upload)
router.post("/", uploadJournalPhotos, journalController.createEntry);

// Update entry (with photo upload)
router.put("/:id", uploadJournalPhotos, journalController.updateEntry);

// Delete entry
router.delete("/:id", journalController.deleteEntry);

export default router;
