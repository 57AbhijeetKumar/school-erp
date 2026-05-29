const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Teacher = require('../models/Teacher');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, school: user.school, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// One-time super admin setup — fails if one already exists
const setupSuperAdmin = async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'superadmin' });
    if (exists) return res.status(409).json({ message: 'Super admin already exists' });

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const superAdmin = await User.create({ name, email, password, role: 'superadmin' });
    res.status(201).json({
      message: 'Super admin created. Please log in.',
      user: { id: superAdmin._id, name: superAdmin.name, email: superAdmin.email, role: superAdmin.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('school', 'name type isActive');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (user.school && !user.school.isActive) {
      return res.status(403).json({ message: 'Your school account is deactivated' });
    }
    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/teacher/login  — used by the mobile app
const teacherMobileLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const teacher = await Teacher.findOne({ mobile }).populate('school', 'name type isActive');
    if (!teacher || !(await teacher.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }
    if (!teacher.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }
    if (teacher.school && !teacher.school.isActive) {
      return res.status(403).json({ message: 'Your school account is deactivated' });
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher', school: teacher.school?._id, tokenVersion: teacher.tokenVersion ?? 0 },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      teacher: {
        id:      teacher._id,
        name:    teacher.name,
        mobile:  teacher.mobile,
        subject: teacher.subject || null,
        role:    'teacher',
        school:  teacher.school || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/logout  — invalidates the caller's JWT by incrementing tokenVersion
const adminLogout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/teacher/logout  — invalidates the teacher's JWT
const teacherLogout = async (req, res) => {
  try {
    await Teacher.findByIdAndUpdate(req.teacher.id, { $inc: { tokenVersion: 1 } });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { setupSuperAdmin, login, teacherMobileLogin, adminLogout, teacherLogout };
