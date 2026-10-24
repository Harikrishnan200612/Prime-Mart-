const express = require('express');
const router = express.Router();
const jwt = require('jwt-simple');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!businessName || !ownerName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = new User({
      businessName,
      ownerName,
      email,
      phone,
      password
    });

    await user.save();

    // Generate token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.encode({ userId: user._id, email: user.email }, secret);

    res.json({
      token,
      user: {
        _id: user._id,
        businessName: user.businessName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.encode({ userId: user._id, email: user.email }, secret);

    res.json({
      token,
      user: {
        _id: user._id,
        businessName: user.businessName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update current user profile / credentials
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, password, confirmPassword, businessName, ownerName, phone } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Invalid email address format' });
      }
      const existing = await User.findOne({ email: cleanEmail });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email address already in use by another account' });
      }
      user.email = cleanEmail;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      user.password = password; // pre('save') hook will automatically hash with bcrypt
    }

    if (businessName && businessName.trim()) user.businessName = businessName.trim();
    if (ownerName && ownerName.trim()) user.ownerName = ownerName.trim();
    if (phone && phone.trim()) user.phone = phone.trim();

    await user.save();

    // Reissue JWT token with updated email
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.encode({ userId: user._id, email: user.email }, secret);

    res.json({
      message: 'Account credentials updated successfully',
      token,
      user: {
        _id: user._id,
        businessName: user.businessName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update credentials', error: err.message });
  }
});

module.exports = router;
