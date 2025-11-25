import express from 'express';
import LinkRequest from '../models/LinkRequest.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Send link request to parent by email
router.post('/send-request', authMiddleware, async (req, res) => {
  try {
    const { parentEmail, message } = req.body;
    const requesterId = req.user.userId;

    if (!parentEmail) {
      return res.status(400).json({ message: 'Parent email is required' });
    }

    // Get requester info
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    // Find parent by email
    const parent = await User.findOne({ email: parentEmail });
    if (!parent) {
      return res.status(404).json({ message: 'No parent account found with this email' });
    }

    // Check if parent is actually a parent (mother or father)
    if (parent.role !== 'mother' && parent.role !== 'father') {
      return res.status(400).json({ message: 'This email does not belong to a parent account' });
    }

    // Check if requester is trying to link to themselves
    if (requesterId === parent._id.toString()) {
      return res.status(400).json({ message: 'You cannot send a link request to yourself' });
    }

    // Check if already linked
    if (requester.relatedParentIds && requester.relatedParentIds.some(id => id.toString() === parent._id.toString())) {
      return res.status(400).json({ message: 'You are already linked to this parent' });
    }

    // Check if there's already a pending request
    const existingRequest = await LinkRequest.findOne({
      requesterId,
      parentId: parent._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request to this parent' });
    }

    // Create link request
    const linkRequest = new LinkRequest({
      requesterId,
      requesterName: requester.name,
      requesterRole: requester.role === 'others' ? requester.customRole : requester.role,
      parentId: parent._id,
      parentEmail: parent.email,
      message: message || ''
    });

    await linkRequest.save();

    res.status(201).json({
      message: 'Link request sent successfully',
      data: linkRequest
    });
  } catch (error) {
    console.error('Error sending link request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending link requests for the logged-in parent
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const parentId = req.user.userId;

    // Get user to check if they're a parent
    const user = await User.findById(parentId);
    if (!user || (user.role !== 'mother' && user.role !== 'father')) {
      return res.json({ data: [] }); // Return empty array if not a parent
    }

    const requests = await LinkRequest.find({
      parentId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (error) {
    console.error('Error fetching link requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get count of pending link requests
router.get('/pending/count', authMiddleware, async (req, res) => {
  try {
    const parentId = req.user.userId;

    const count = await LinkRequest.countDocuments({
      parentId,
      status: 'pending'
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting link requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept link request
router.post('/accept/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const parentId = req.user.userId;

    const linkRequest = await LinkRequest.findById(requestId);
    if (!linkRequest) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Verify the request is for this parent
    if (linkRequest.parentId.toString() !== parentId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (linkRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update requester's relatedParentIds
    const requester = await User.findById(linkRequest.requesterId);
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    if (!requester.relatedParentIds) {
      requester.relatedParentIds = [];
    }
    
    if (!requester.relatedParentIds.includes(parentId)) {
      requester.relatedParentIds.push(parentId);
      await requester.save();
    }

    // Update link request status
    linkRequest.status = 'accepted';
    await linkRequest.save();

    res.json({
      message: 'Link request accepted successfully',
      data: linkRequest
    });
  } catch (error) {
    console.error('Error accepting link request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decline link request
router.post('/decline/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const parentId = req.user.userId;

    const linkRequest = await LinkRequest.findById(requestId);
    if (!linkRequest) {
      return res.status(404).json({ message: 'Link request not found' });
    }

    // Verify the request is for this parent
    if (linkRequest.parentId.toString() !== parentId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (linkRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update link request status
    linkRequest.status = 'declined';
    await linkRequest.save();

    res.json({
      message: 'Link request declined',
      data: linkRequest
    });
  } catch (error) {
    console.error('Error declining link request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all link requests history (for the requester)
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.userId;

    const requests = await LinkRequest.find({ requesterId })
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
