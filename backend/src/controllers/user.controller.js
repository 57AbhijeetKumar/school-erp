const User = require('../models/User');

const getAll = async (req, res) => {
  try {
    // Superadmin sees all; school admin sees only their school's users
    const filter = req.user.role === 'superadmin' ? {} : { school: req.user.school };
    const users = await User.find(filter).select('-password').populate('school', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('school', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent cross-school access
    if (req.user.role !== 'superadmin' && String(user.school?._id) !== String(req.user.school)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, role, isActive } = req.body;

    // School admins can only update users within their own school
    const filter = req.user.role === 'superadmin'
      ? { _id: req.params.id }
      : { _id: req.params.id, school: req.user.school };

    // Prevent a school admin from escalating anyone to superadmin
    if (req.user.role !== 'superadmin' && role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot assign superadmin role' });
    }

    const user = await User.findOneAndUpdate(
      filter,
      { name, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    // School admins can only delete users within their own school
    const filter = req.user.role === 'superadmin'
      ? { _id: req.params.id }
      : { _id: req.params.id, school: req.user.school };

    const user = await User.findOneAndDelete(filter);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getById, update, remove };
