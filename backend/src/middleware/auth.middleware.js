const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Teacher = require('../models/Teacher');
const School  = require('../models/School');
const Student = require('../models/Student');

// Used by admin + superadmin routes.
// For admin role: also checks that the school subscription is still active.
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    const dbUser = await User.findById(req.user.id).select('isActive tokenVersion');
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ message: 'Account is deactivated or not found' });
    }
    if ((req.user.tokenVersion ?? 0) !== dbUser.tokenVersion) {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    if (req.user.role === 'admin' && req.user.school) {
      const school = await School.findById(req.user.school).select('isActive');
      if (!school || !school.isActive) {
        return res.status(403).json({ message: 'Your school subscription has been deactivated. Please contact support.' });
      }
    }

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (!['superadmin', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const schoolScope = (req, res, next) => {
  // Superadmin can access any school; others are locked to their own school
  if (req.user?.role === 'superadmin') return next();
  if (!req.user?.school) {
    return res.status(403).json({ message: 'Not associated with any school' });
  }
  req.schoolId = req.user.school;
  next();
};

// Used by the teacher mobile app — validates teacher is active AND school subscription is active.
const teacherProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access only' });
    }

    const teacher = await Teacher.findById(decoded.id).select('isActive tokenVersion');
    if (!teacher || !teacher.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact your school admin.' });
    }
    if ((decoded.tokenVersion ?? 0) !== teacher.tokenVersion) {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    const school = await School.findById(decoded.school).select('isActive');
    if (!school || !school.isActive) {
      return res.status(403).json({ message: 'Your school subscription has been deactivated. Please contact your school admin.' });
    }

    req.teacher = decoded; // { id, role: 'teacher', school }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Used by the parent mobile app — validates the JWT and checks that the school subscription is active.
const parentProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'parent') {
      return res.status(403).json({ message: 'Parent access only' });
    }

    // Find any child linked to this parent and confirm their school is active.
    const child = await Student.findOne({ parentMobile: decoded.mobile })
      .select('school')
      .populate({ path: 'school', select: 'isActive', match: { isActive: true } });
    if (!child || !child.school) {
      return res.status(403).json({ message: 'Your school subscription has been deactivated. Please contact your school admin.' });
    }

    req.parent = decoded; // { role: 'parent', mobile }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { protect, superAdminOnly, adminOnly, schoolScope, teacherProtect, parentProtect };
