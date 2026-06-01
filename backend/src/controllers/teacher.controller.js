const Teacher  = require('../models/Teacher');
const Class    = require('../models/Class');
const Homework = require('../models/Homework');

const createTeacher = async (req, res) => {
  try {
    const { name, mobile, subject, email } = req.body;
    const schoolId = req.user.school;

    if (!name || !mobile) {
      return res.status(400).json({ message: 'Name and mobile number are required' });
    }
    if (name.trim().length > 100) return res.status(400).json({ message: 'Teacher name cannot exceed 100 characters' });

    const exists = await Teacher.findOne({ mobile });
    if (exists) {
      return res.status(409).json({ message: 'Mobile number already registered to another teacher' });
    }

    const teacher = await Teacher.create({ name, mobile, subject, email, password: '123456', school: schoolId });

    res.status(201).json({
      message: 'Teacher added successfully',
      teacher: {
        id:              teacher._id,
        name:            teacher.name,
        mobile:          teacher.mobile,
        subject:         teacher.subject || null,
        email:           teacher.email   || null,
        isActive:        teacher.isActive,
        defaultPassword: '123456',
        loginInfo:       `Mobile: ${teacher.mobile} | Password: 123456`,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({ school: req.user.school })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teachers/:id
// Cascade: unset classTeacher on any class that referenced this teacher.
// Homework is intentionally NOT deleted — it belongs to the class, not the teacher.
// The new class teacher will still see all historical homework via the class-scoped query.
const deleteTeacher = async (req, res) => {
  try {
    const schoolId = req.user.school;

    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, school: schoolId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found in your school' });

    // If they were a class teacher, unset that reference so the class is not orphaned
    await Class.updateMany({ classTeacher: teacher._id, school: schoolId }, { $unset: { classTeacher: '' } });

    // Homework is preserved — the new class teacher will see it via the class-scoped query.
    // assignedBy will resolve to null on populate, which the app handles gracefully.
    const hwCount = await Homework.countDocuments({ assignedBy: teacher._id, school: schoolId });

    res.json({
      message: `Teacher "${teacher.name}" removed. ${hwCount} homework assignment(s) preserved for the class record.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/teachers/:id/status
// Toggles isActive. Deactivating also removes class teacher assignment.
const toggleTeacherActive = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const teacher  = await Teacher.findOne({ _id: req.params.id, school: schoolId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    // If deactivating and they are a class teacher, unset that assignment
    if (!teacher.isActive) {
      await Class.updateMany(
        { classTeacher: teacher._id, school: schoolId },
        { $unset: { classTeacher: '' } }
      );
    }

    res.json({
      message:  `Teacher "${teacher.name}" has been ${teacher.isActive ? 'reactivated' : 'deactivated'}.`,
      isActive: teacher.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTeacher, getAllTeachers, toggleTeacherActive, deleteTeacher };
