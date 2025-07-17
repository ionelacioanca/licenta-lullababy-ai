import express from 'express';
import babyController from '../controllers/babyController.js';

const babyRouter = express.Router();

babyRouter.get("/baby/:id", async (req, res) => {
    try {
        const baby = await babyController.getbabyById(req.params.id);
        res.status(200).json(baby);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

babyRouter.post("/babyDetails", async (req, res) => {
    try {
        const baby = await babyController.createBaby(req.body);
        res.status(201).json({ message: "Baby created successfully", baby });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

babyRouter.patch("/baby/:id", async (req, res) => {
    try {
        const updatedBaby = await babyController.updateBaby(req.params.id, req.body);
        res.status(200).json(updatedBaby);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

babyRouter.put("/baby/:id", async (req, res) => {
    try {
        const updatedBaby = await babyController.updateBaby(req.params.id, req.body);
        res.status(200).json(updatedBaby);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

babyRouter.delete("/baby/:id", async (req, res) => {
    try {
        await babyController.deleteBaby(req.params.id);
        res.status(200).json({ message: "Baby deleted successfully" });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

babyRouter.get("/baby/parent/:parentId", async (req, res) => {
  try {
    const babies = await babyController.getBabiesByParentId(req.params.parentId);
    if (!babies || babies.length === 0) {
      return res.status(404).json({ message: "No babies found for this parent." });
    }
    res.status(200).json(babies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default babyRouter;
