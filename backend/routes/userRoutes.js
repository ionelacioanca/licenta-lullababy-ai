import express from 'express';
import User from '../models/User.js';
import LinkRequest from '../models/LinkRequest.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => { 
  const { name, email, password, role, relatedParentEmail } = req.body;

  try {
    // Determine if role is a custom role (not one of the standard enum values)
    const validRoles = ["mother", "father", "nanny", "others"];
    let actualRole = role;
    let customRole = null;
    
    if (!validRoles.includes(role)) {
      // It's a custom role (like "aunt", "uncle", "grandma")
      customRole = role;
      actualRole = "others";
    }
    
    const userData = { name, email, password, role: actualRole };
    if (customRole) {
      userData.customRole = customRole;
    }
    
    const newUser = new User(userData);
    await newUser.save();
    console.log("newUser:", newUser);
    console.log("newUser._id:", newUser._id);

    // If relatedParentEmail provided (for nanny/others), create a link request instead of auto-linking
    if (relatedParentEmail) {
      try {
        const parentUser = await User.findOne({ email: relatedParentEmail });
        
        if (parentUser && (parentUser.role === 'mother' || parentUser.role === 'father')) {
          // Create a pending link request
          const linkRequest = new LinkRequest({
            requesterId: newUser._id,
            requesterName: newUser.name,
            requesterRole: actualRole === 'others' ? customRole : actualRole,
            parentId: parentUser._id,
            parentEmail: parentUser.email,
            message: 'Sent during registration'
          });
          
          await linkRequest.save();
          console.log(`Created link request from ${email} to parent ${relatedParentEmail}`);
        } else {
          console.warn(`Parent email ${relatedParentEmail} not found or not a parent role, skipping link request`);
        }
      } catch (linkError) {
        console.error('Error creating link request:', linkError);
        // Don't fail registration if link request creation fails
      }
    }

    // Generate token for the new user
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ 
      message: 'User registered successfully',
      parentId: newUser._id.toString(),
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'User already exists' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables!');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET missing' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password match, generating token...');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('Login successful for user:', email, 'parentId:', user._id);
    res.json({
      token,
      name: user.name,
      parentId: user._id.toString(),
      email: user.email,
      role: user.customRole || user.role // Return custom role if exists
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth - Check if user exists
router.post('/auth/google/check', async (req, res) => {
  const { email, name, googleId, picture } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });

    if (user) {
      // User exists - proceed with login
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      return res.json({
        exists: true,
        token,
        name: user.name,
        parentId: user._id.toString(),
        email: user.email,
        role: user.customRole || user.role,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.customRole || user.role
        }
      });
    } else {
      // User doesn't exist - need to register
      return res.json({
        exists: false,
        googleData: {
          email,
          name,
          googleId,
          picture
        }
      });
    }
  } catch (error) {
    console.error('Google auth check error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

// Google OAuth Registration - with role
router.post('/auth/google/register', async (req, res) => {
  const { email, name, googleId, picture, role, customRole } = req.body;

  try {
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine actual role
    const validRoles = ["mother", "father", "nanny", "others"];
    let actualRole = role;
    let userCustomRole = null;
    
    if (!validRoles.includes(role)) {
      userCustomRole = role;
      actualRole = "others";
    } else if (customRole) {
      userCustomRole = customRole;
    }

    // Create new user
    user = new User({
      name: name || email.split('@')[0],
      email,
      password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
      role: actualRole,
      customRole: userCustomRole,
      googleId,
    });
    await user.save();
    console.log('New Google user created:', user.email);

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      name: user.name,
      parentId: user._id.toString(),
      email: user.email,
      role: user.customRole || user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.customRole || user.role
      }
    });
  } catch (error) {
    console.error('Google registration error:', error);
    res.status(500).json({ message: 'Google registration failed', error: error.message });
  }
});


router.get('/verify-token', auth, (req, res) => {
  res.json({ message: 'Token valid', user: req.user });
});

// Get user info (authenticated)
router.get('/user-info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      name: user.name,
      email: user.email,
      role: user.customRole || user.role // Return custom role if exists
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Generate a 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    // Send email with reset code
    try {
      const emailService = await import('../services/emailService.js');
      await emailService.default.sendPasswordResetCode(email, resetCode, user.name);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send email, but reset code saved:', emailError);
      // Still save the code in database even if email fails
      // Log it for development
      console.log(`Password reset code for ${email}: ${resetCode}`);
    }

    res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Code is valid
    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Set plain password - the pre-save hook will hash it
    user.password = newPassword;
    
    // Clear reset code fields
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    
    await user.save();

    console.log(`Password reset successful for ${email}`);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password (authenticated)
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    console.log(`Password changed for user ${user.email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change email (authenticated)
router.post('/change-email', auth, async (req, res) => {
  const { newEmail, password } = req.body;

  try {
    if (!newEmail || !password) {
      return res.status(400).json({ message: 'New email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    user.email = newEmail;
    await user.save();

    console.log(`Email changed for user to ${newEmail}`);
    res.json({ message: 'Email changed successfully' });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Link related parent (authenticated)
router.post('/link-parent', auth, async (req, res) => {
  const { relatedParentEmail } = req.body;

  try {
    if (!relatedParentEmail) {
      return res.status(400).json({ message: 'Related parent email is required' });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the related parent
    const relatedParent = await User.findOne({ email: relatedParentEmail });
    if (!relatedParent) {
      return res.status(404).json({ message: 'Parent not found with that email' });
    }

    // For nanny/others: can link with any parent (mother/father)
    if (currentUser.role === 'nanny' || (currentUser.role !== 'mother' && currentUser.role !== 'father')) {
      // Verify the parent is mother or father
      if (relatedParent.role !== 'mother' && relatedParent.role !== 'father') {
        return res.status(400).json({ message: 'Can only link with mother or father accounts' });
      }
    }
    // For mother/father: linking with each other
    else if (currentUser.role === 'mother' || currentUser.role === 'father') {
      // Both must be mother or father
      if (relatedParent.role !== 'mother' && relatedParent.role !== 'father') {
        return res.status(400).json({ message: 'Can only link with mother or father accounts' });
      }
    }

    // For nanny/others linking with parent: create link request instead of auto-linking
    if (currentUser.role === 'nanny' || (currentUser.role !== 'mother' && currentUser.role !== 'father')) {
      // Check if already linked
      if (currentUser.relatedParentIds && currentUser.relatedParentIds.some(id => id.toString() === relatedParent._id.toString())) {
        return res.status(400).json({ message: 'Already linked with this parent' });
      }
      
      // Check if there's already a pending request
      const existingRequest = await LinkRequest.findOne({
        requesterId: currentUser._id,
        parentId: relatedParent._id,
        status: 'pending'
      });
      
      if (existingRequest) {
        return res.status(400).json({ message: 'You already have a pending request to this parent' });
      }
      
      // Create link request
      const linkRequest = new LinkRequest({
        requesterId: currentUser._id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role === 'others' ? currentUser.customRole : currentUser.role,
        parentId: relatedParent._id,
        parentEmail: relatedParent.email,
        message: ''
      });
      
      await linkRequest.save();
      console.log(`Created link request from ${currentUser.email} to ${relatedParent.email}`);
      
      return res.json({ 
        message: 'Link request sent to parent. They will be notified and can accept or decline.',
        requestSent: true
      });
    }
    // For mother/father: direct bidirectional link (no request needed) using relatedParentIds array
    else {
      // Check if already linked
      if (currentUser.relatedParentIds && currentUser.relatedParentIds.some(id => id.toString() === relatedParent._id.toString())) {
        return res.status(400).json({ message: 'Already linked with this user' });
      }
      
      // Add to current user's relatedParentIds
      if (!currentUser.relatedParentIds) {
        currentUser.relatedParentIds = [];
      }
      currentUser.relatedParentIds.push(relatedParent._id);
      await currentUser.save();
      
      // Add to related parent's relatedParentIds (bidirectional)
      if (!relatedParent.relatedParentIds) {
        relatedParent.relatedParentIds = [];
      }
      relatedParent.relatedParentIds.push(currentUser._id);
      await relatedParent.save();
      
      console.log(`[Direct Link] Linked ${currentUser.email} with ${relatedParent.email} (parent direct link)`);
      res.json({ 
        message: 'Parents linked successfully',
        relatedParentName: relatedParent.name
      });
    }
  } catch (error) {
    console.error('Link parent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get linked parent(s) (authenticated)
router.get('/linked-parent', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId)
      .populate('relatedParentId', 'name email')
      .populate('relatedParentIds', 'name email');
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Get linked parent for user ${currentUser.email}, role: ${currentUser.role}`);
    
    // For nanny: return array of linked parents
    if (currentUser.role === 'nanny') {
      const parents = (currentUser.relatedParentIds || []).map(parent => ({
        id: parent._id,
        name: parent.name,
        email: parent.email
      }));
      console.log(`Nanny has ${parents.length} linked parents`);
      res.json({ relatedParents: parents, isNanny: true });
    }
    // For mother/father: return array of linked users (nannies, partners, etc.) AND old single link if exists
    else if (currentUser.role === 'mother' || currentUser.role === 'father') {
      console.log(`[Linked Parent] Parent ${currentUser.email} relatedParentIds:`, currentUser.relatedParentIds);
      console.log(`[Linked Parent] Parent ${currentUser.email} relatedParentId:`, currentUser.relatedParentId);
      
      const linkedUsers = (currentUser.relatedParentIds || []).map(user => ({
        id: user._id,
        name: user.name,
        email: user.email
      }));
      console.log(`[Linked Parent] Parent has ${linkedUsers.length} linked users:`, linkedUsers);
      
      // Also check for old single parent link
      const response = {
        relatedParents: linkedUsers,
        isNanny: true // Use same structure as nanny to show list
      };
      
      // Add old single link if exists
      if (currentUser.relatedParentId) {
        response.relatedParentName = currentUser.relatedParentId.name;
        response.relatedParentEmail = currentUser.relatedParentId.email;
      }
      
      console.log(`[Linked Parent] Sending response:`, response);
      res.json(response);
    }
    // For others: return single linked parent if exists
    else if (currentUser.relatedParentId) {
      console.log(`User has single linked parent: ${currentUser.relatedParentId.name}`);
      res.json({ 
        relatedParentName: currentUser.relatedParentId.name,
        relatedParentEmail: currentUser.relatedParentId.email,
        isNanny: false
      });
    } 
    // For others with relatedParentIds array
    else if (currentUser.relatedParentIds && currentUser.relatedParentIds.length > 0) {
      const parents = currentUser.relatedParentIds.map(parent => ({
        id: parent._id,
        name: parent.name,
        email: parent.email
      }));
      console.log(`User (others) has ${parents.length} linked parents`);
      res.json({ relatedParents: parents, isNanny: true });
    }
    else {
      console.log(`User has no linked parents`);
      res.json({ relatedParents: [], isNanny: false });
    }
  } catch (error) {
    console.error('Get linked parent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unlink parent (authenticated)
router.post('/unlink-parent', auth, async (req, res) => {
  try {
    const { parentId } = req.body; // Specify which user to unlink from relatedParentIds array
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[Unlink] User ${currentUser.email} wants to unlink from ${parentId}`);

    // Handle unlinking from relatedParentIds array (for everyone using the new system)
    if (parentId && currentUser.relatedParentIds && currentUser.relatedParentIds.length > 0) {
      // Check if the parent exists in the array
      const parentExists = currentUser.relatedParentIds.some(id => id.toString() === parentId.toString());
      
      if (!parentExists) {
        return res.status(400).json({ message: 'This user is not in your linked list' });
      }
      
      // Remove from current user's array
      currentUser.relatedParentIds = currentUser.relatedParentIds.filter(
        id => id.toString() !== parentId.toString()
      );
      await currentUser.save();
      console.log(`[Unlink] Removed ${parentId} from ${currentUser.email}'s relatedParentIds`);
      
      // Also remove current user from the other user's array (bidirectional)
      const otherUser = await User.findById(parentId);
      if (otherUser && otherUser.relatedParentIds && otherUser.relatedParentIds.length > 0) {
        otherUser.relatedParentIds = otherUser.relatedParentIds.filter(
          id => id.toString() !== currentUser._id.toString()
        );
        await otherUser.save();
        console.log(`[Unlink] Removed ${currentUser._id} from ${otherUser.email}'s relatedParentIds`);
      }
      
      res.json({ message: 'User unlinked successfully' });
    }
    // Handle old single parent link (relatedParentId)
    else if (!parentId && currentUser.relatedParentId) {
      const relatedParent = await User.findById(currentUser.relatedParentId);
      
      currentUser.relatedParentId = undefined;
      await currentUser.save();
      console.log(`[Unlink] Removed relatedParentId from ${currentUser.email}`);

      if (relatedParent) {
        relatedParent.relatedParentId = undefined;
        await relatedParent.save();
        console.log(`[Unlink] Unlinked ${currentUser.email} from ${relatedParent.email} (old system)`);
      }
      
      res.json({ message: 'User unlinked successfully' });
    }
    else {
      return res.status(400).json({ message: 'No linked users to unlink' });
    }
  } catch (error) {
    console.error('Unlink parent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete account (authenticated)
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Import Baby model
    const Baby = (await import('../models/Baby.js')).default;
    
    // Delete all babies associated with this parent
    await Baby.deleteMany({ parentId: req.user.userId });
    console.log(`Deleted all babies for user: ${user.email}`);

    // If user has a linked parent, remove the link from them
    if (user.relatedParentId) {
      const relatedParent = await User.findById(user.relatedParentId);
      if (relatedParent) {
        relatedParent.relatedParentId = undefined;
        await relatedParent.save();
        console.log(`Removed link from related parent: ${relatedParent.email}`);
      }
    }

    // Delete the user account
    await User.findByIdAndDelete(req.user.userId);
    console.log(`Deleted account: ${user.email}`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;