const Staff = require('../models/Staff');
const bcrypt = require('bcryptjs');

const addStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, salary } = req.body;

    const existing = await Staff.findOne({ email, shopId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = new Staff({
      shopId: req.user.id,
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      salary
    });

    await staff.save();

    const staffObj = staff.toObject();
    delete staffObj.password;

    res.status(201).json({ message: 'Staff added successfully', staff: staffObj });
  } catch (error) {
    console.error('addStaff error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ shopId: req.user.id }).select('-password');
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.password;

    const staff = await Staff.findOneAndUpdate(
      { _id: id, shopId: req.user.id },
      updates,
      { new: true }
    ).select('-password');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.status(200).json({ message: 'Staff updated', staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findOneAndDelete({ _id: id, shopId: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addStaff, getStaff, updateStaff, deleteStaff };
