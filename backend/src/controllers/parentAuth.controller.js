const jwt     = require('jsonwebtoken');
const Student = require('../models/Student');

const PARENT_PASSWORD = '123456';

const parentLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile and password are required' });
    }

    if (password !== PARENT_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const students = await Student.find({ parentMobile: mobile.trim(), isDeleted: { $ne: true } })
      .populate('enrolledClass', 'name section')
      .populate('school', 'name isActive')
      .select('name rollNumber enrolledClass school');

    if (students.length === 0) {
      return res.status(401).json({ message: 'No student registered with this mobile number' });
    }

    const activeStudents = students.filter(s => s.school?.isActive);
    if (activeStudents.length === 0) {
      return res.status(403).json({ message: 'Your school subscription has been deactivated. Please contact your school admin.' });
    }

    // Embed the exact set of student IDs this parent is allowed to access.
    // verifiedStudent validates against this list so a parent cannot access
    // another parent's child even if mobile numbers overlap.
    const allowedStudentIds = activeStudents.map(s => s._id.toString());

    const token = jwt.sign(
      { role: 'parent', mobile: mobile.trim(), studentIds: allowedStudentIds },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      children: activeStudents.map(s => ({
        studentId:  s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        className:  s.enrolledClass?.name   || '',
        section:    s.enrolledClass?.section || null,
        school:     s.school?.name || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { parentLogin };
