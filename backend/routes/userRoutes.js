import express from 'express';
import User from '../models/User.js';
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

    // If relatedParentEmail provided (for nanny/others), link with parent
    if (relatedParentEmail) {
      try {
        const parentUser = await User.findOne({ email: relatedParentEmail });
        
        if (parentUser) {
          // For nanny, use relatedParentIds array (multiple parents)
          if (actualRole === 'nanny') {
            newUser.relatedParentIds = [parentUser._id];
            await newUser.save();
            console.log(`Linked nanny ${email} with parent ${relatedParentEmail}`);
          } 
          // For others (custom roles), use single relatedParentId
          else {
            newUser.relatedParentId = parentUser._id;
            await newUser.save();
            console.log(`Linked ${email} with parent ${relatedParentEmail}`);
          }
        } else {
          console.warn(`Parent email ${relatedParentEmail} not found, skipping link`);
        }
      } catch (linkError) {
        console.error('Error linking with parent:', linkError);
        // Don't fail registration if linking fails
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

    // For nanny: add to relatedParentIds array
    if (currentUser.role === 'nanny') {
      if (!currentUser.relatedParentIds) {
        currentUser.relatedParentIds = [];
      }
      // Check if already linked
      if (currentUser.relatedParentIds.some(id => id.toString() === relatedParent._id.toString())) {
        return res.status(400).json({ message: 'Already linked with this parent' });
      }
      currentUser.relatedParentIds.push(relatedParent._id);
      await currentUser.save();
      console.log(`Added parent ${relatedParent.email} to nanny ${currentUser.email}`);
    }
    // For mother/father: bidirectional link
    else {
      currentUser.relatedParentId = relatedParent._id;
      await currentUser.save();
      relatedParent.relatedParentId = currentUser._id;
      await relatedParent.save();
    }

    console.log(`Linked ${currentUser.email} with ${relatedParent.email}`);
    res.json({ 
      message: 'Parents linked successfully',
      relatedParentName: relatedParent.name
    });
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
    // For mother/father/others: return single linked parent
    else if (currentUser.relatedParentId) {
      console.log(`User has single linked parent: ${currentUser.relatedParentId.name}`);
      res.json({ 
        relatedParentName: currentUser.relatedParentId.name,
        relatedParentEmail: currentUser.relatedParentId.email,
        isNanny: false
      });
    } else {
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
    const { parentId } = req.body; // For nanny: specify which parent to unlink
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For nanny: remove specific parent from array
    if (currentUser.role === 'nanny') {
      if (!parentId) {
        return res.status(400).json({ message: 'Parent ID required for unlinking' });
      }
      if (!currentUser.relatedParentIds || currentUser.relatedParentIds.length === 0) {
        return res.status(400).json({ message: 'No linked parents to unlink' });
      }
      
      currentUser.relatedParentIds = currentUser.relatedParentIds.filter(
        id => id.toString() !== parentId.toString()
      );
      await currentUser.save();
      console.log(`Removed parent ${parentId} from nanny ${currentUser.email}`);
    }
    // For mother/father/others: bidirectional unlink
    else {
      if (!currentUser.relatedParentId) {
        return res.status(400).json({ message: 'No linked parent to unlink' });
      }

      const relatedParent = await User.findById(currentUser.relatedParentId);
      
      currentUser.relatedParentId = undefined;
      await currentUser.save();

      if (relatedParent) {
        relatedParent.relatedParentId = undefined;
        await relatedParent.save();
        console.log(`Unlinked ${currentUser.email} from ${relatedParent.email}`);
      }
    }

    res.json({ message: 'Parent unlinked successfully' });
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