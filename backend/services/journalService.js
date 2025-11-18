import JournalEntry from "../models/JournalEntry.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all journal entries for a baby (sorted by date, newest first)
export const getJournalEntries = async (babyId, limit = null, skip = 0) => {
  try {
    let query = JournalEntry.find({ babyId }).sort({ date: -1 });
    
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    
    const entries = await query;
    return entries;
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
};

// Get single journal entry by ID
export const getJournalEntry = async (entryId) => {
  try {
    const entry = await JournalEntry.findById(entryId);
    return entry;
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    throw error;
  }
};

// Create new journal entry
export const createJournalEntry = async (babyId, entryData) => {
  try {
    const entry = new JournalEntry({
      babyId,
      ...entryData
    });
    
    await entry.save();
    return entry;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
};

// Update journal entry
export const updateJournalEntry = async (entryId, updateData) => {
  try {
    const entry = await JournalEntry.findByIdAndUpdate(
      entryId,
      updateData,
      { new: true, runValidators: true }
    );
    return entry;
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
};

// Delete journal entry and associated photos
export const deleteJournalEntry = async (entryId) => {
  try {
    const entry = await JournalEntry.findById(entryId);
    
    if (!entry) {
      throw new Error("Journal entry not found");
    }
    
    // Delete associated photos from filesystem
    if (entry.photos && entry.photos.length > 0) {
      entry.photos.forEach((photoPath) => {
        const fullPath = path.join(__dirname, "..", photoPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    
    await JournalEntry.findByIdAndDelete(entryId);
    return { message: "Journal entry deleted successfully" };
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
};

// Get all photos from journal entries for a baby (for gallery view)
export const getJournalGallery = async (babyId) => {
  try {
    const entries = await JournalEntry.find({ babyId, photos: { $exists: true, $ne: [] } })
      .select('photos photoCaptions title date')
      .sort({ date: -1 });
    
    // Flatten photos from all entries with their metadata
    const gallery = [];
    entries.forEach((entry) => {
      entry.photos.forEach((photo, index) => {
        gallery.push({
          photoUrl: photo,
          caption: entry.photoCaptions[index] || '',
          entryTitle: entry.title,
          entryDate: entry.date,
          entryId: entry._id
        });
      });
    });
    
    return gallery;
  } catch (error) {
    console.error("Error fetching journal gallery:", error);
    throw error;
  }
};

// Get recent entries (for dashboard)
export const getRecentEntries = async (babyId, limit = 2) => {
  try {
    const entries = await JournalEntry.find({ babyId })
      .sort({ date: -1 })
      .limit(limit)
      .select('title description date photos mood tags');
    return entries;
  } catch (error) {
    console.error("Error fetching recent entries:", error);
    throw error;
  }
};
