const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Staff = require('../models/Staff');

// Get all staff
router.get('/', auth, async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const staff = await Staff.find(query).sort({ joiningDate: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
});

// Get single staff
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, userId: req.userId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
});

// Add staff
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, role, salary } = req.body;

    if (!name || !phone || !email || !role || salary === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newStaff = new Staff({
      userId: req.userId,
      name,
      phone,
      email,
      role,
      salary
    });

    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add staff' });
  }
});

// Update staff
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, email, role, salary, status } = req.body;

    const staff = await Staff.findOne({ _id: req.params.id, userId: req.userId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (name) staff.name = name;
    if (phone) staff.phone = phone;
    if (email) staff.email = email;
    if (role) staff.role = role;
    if (salary !== undefined) staff.salary = salary;
    if (status) staff.status = status;

    staff.updatedAt = Date.now();
    await staff.save();

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update staff' });
  }
});

// Delete staff
router.delete('/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete staff' });
  }
});

module.exports = router;
