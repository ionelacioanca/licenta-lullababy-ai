import * as journalService from "../services/journalService.js";

// Get all journal entries for a baby
export const getEntries = async (req, res, next) => {
  try {
    const { babyId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    
    const entries = await journalService.getJournalEntries(babyId, limit, skip);
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

// Get single journal entry
export const getEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await journalService.getJournalEntry(id);
    
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

// Create new journal entry
export const createEntry = async (req, res, next) => {
  try {
    const { babyId, title, description, date, tags, mood, photoCaptions } = req.body;
    
    // Handle uploaded photos
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map(file => `/uploads/journal/${file.filename}`);
    }
    
    // Parse photoCaptions if it's a string
    let captions = [];
    if (photoCaptions) {
      captions = typeof photoCaptions === 'string' ? JSON.parse(photoCaptions) : photoCaptions;
    }
    
    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const entryData = {
      title: title || '',
      description,
      date: date || new Date(),
      photos,
      photoCaptions: captions,
      tags: parsedTags,
      mood: mood || 'neutral'
    };
    
    const entry = await journalService.createJournalEntry(babyId, entryData);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// Update journal entry
export const updateEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, tags, mood, photoCaptions, existingPhotos } = req.body;
    
    // Get existing entry to merge photos
    const existingEntry = await journalService.getJournalEntry(id);
    if (!existingEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    
    // Handle photos: keep existing + add new ones
    let photos = [];
    if (existingPhotos) {
      photos = typeof existingPhotos === 'string' ? JSON.parse(existingPhotos) : existingPhotos;
    }
    
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/journal/${file.filename}`);
      photos = [...photos, ...newPhotos];
    }
    
    // Limit to 5 photos max
    photos = photos.slice(0, 5);
    
    // Parse captions and tags
    let captions = [];
    if (photoCaptions) {
      captions = typeof photoCaptions === 'string' ? JSON.parse(photoCaptions) : photoCaptions;
    }
    
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const updateData = {
      title: title || '',
      description,
      date: date || existingEntry.date,
      photos,
      photoCaptions: captions,
      tags: parsedTags,
      mood: mood || existingEntry.mood
    };
    
    const entry = await journalService.updateJournalEntry(id, updateData);
    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

// Delete journal entry
export const deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await journalService.deleteJournalEntry(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get gallery (all photos from all entries)
export const getGallery = async (req, res, next) => {
  try {
    const { babyId } = req.params;
    const gallery = await journalService.getJournalGallery(babyId);
    res.status(200).json(gallery);
  } catch (error) {
    next(error);
  }
};

// Get recent entries (for dashboard)
export const getRecentEntries = async (req, res, next) => {
  try {
    const { babyId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 2;
    const entries = await journalService.getRecentEntries(babyId, limit);
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};
