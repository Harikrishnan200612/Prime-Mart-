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

module.exports = router;
