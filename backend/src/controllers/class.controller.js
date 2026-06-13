const mongoose           = require('mongoose');
const Class              = require('../models/Class');
const Student            = require('../models/Student');
const Teacher            = require('../models/Teacher');
const { stripHtml }      = require('../utils/sanitize');
const Attendance         = require('../models/Attendance');
const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Exam               = require('../models/Exam');
const ExamResult         = require('../models/ExamResult');
const Fee                = require('../models/Fee');

const createClass = async (req, res) => {
  try {
    const { name, section, classTeacherId } = req.body;
    const cleanName = stripHtml(name?.trim() || '');
    if (!cleanName) return res.status(400).json({ message: 'Class name is required' });
    if (cleanName.length > 100) return res.status(400).json({ message: 'Class name cannot exceed 100 characters' });

    const cleanSection = stripHtml(section?.trim()) || null;
    const duplicate = await Class.findOne({ name: cleanName, section: cleanSection, school: req.user.school });
    if (duplicate) return res.status(409).json({ message: `Class "${cleanName}" already exists` });

    if (classTeacherId) {
      const teacherExists = await Teacher.findOne({ _id: classTeacherId, school: req.user.school });
      if (!teacherExists) return res.status(404).json({ message: 'Teacher not found in your school' });
      // Release teacher from any other class first
      await Class.findOneAndUpdate(
        { classTeacher: classTeacherId, school: req.user.school },
        { $set: { classTeacher: null } }
      );
    }

    const cls = await Class.create({
      name:         cleanName,
      section:      cleanSection || undefined,
      classTeacher: classTeacherId  || undefined,
      school:       req.user.school,
    });

    const populated = await cls.populate('classTeacher', 'name mobile subject');
    res.status(201).json({ message: 'Class created', class: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({ school: req.user.school })
      .populate('classTeacher', 'name mobile subject')
      .sort({ name: 1, section: 1 });

    const classIds = classes.map(c => c._id);
    const counts   = await Student.aggregate([
      { $match: { enrolledClass: { $in: classIds }, isDeleted: { $ne: true } } },
      { $group: { _id: '$enrolledClass', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach(({ _id, count }) => { countMap[_id.toString()] = count; });

    res.json(classes.map(c => ({ ...c.toObject(), studentCount: countMap[c._id.toString()] || 0 })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignTeacher = async (req, res) => {
  try {
    const { classTeacherId } = req.body;
    const schoolId = req.user.school;
    let movedFromLabel = null;

    if (classTeacherId) {
      // One teacher can only be class teacher of one class at a time.
      // If they already manage another class, remove them from it first.
      const prev = await Class.findOneAndUpdate(
        { classTeacher: classTeacherId, _id: { $ne: req.params.id }, school: schoolId },
        { $set: { classTeacher: null } }
      );
      if (prev) {
        movedFromLabel = prev.section ? `${prev.name} — ${prev.section}` : prev.name;
      }
    }

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, school: schoolId },
      { classTeacher: classTeacherId || null },
      { new: true }
    ).populate('classTeacher', 'name mobile subject');

    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const message = movedFromLabel
      ? `Teacher reassigned from "${movedFromLabel}" — that class now has no class teacher.`
      : 'Teacher assigned';

    res.json({ message, class: cls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/classes/:id
// Full cascade. Uses a transaction on replica sets; falls back to best-effort parallel
// deletes on standalone MongoDB (development) which doesn't support transactions.
const deleteClass = async (req, res) => {
  const cls = await Class.findOne({ _id: req.params.id, school: req.user.school });
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  const [students, homeworks, exams] = await Promise.all([
    Student.find({ enrolledClass: cls._id }).select('_id'),
    Homework.find({ class: cls._id }).select('_id'),
    Exam.find({ class: cls._id }).select('_id'),
  ]);
  const studentIds = students.map(s => s._id);
  const hwIds      = homeworks.map(h => h._id);
  const examIds    = exams.map(e => e._id);

  const runDeletes = async (opts = {}) => {
    const deletes = [
      Attendance.deleteMany({ class: cls._id }, opts),
      Student.deleteMany({ enrolledClass: cls._id }, opts),
      Class.findByIdAndDelete(cls._id, opts),
    ];
    if (studentIds.length > 0) deletes.push(
      Attendance.deleteMany({ student: { $in: studentIds } }, opts),
      ExamResult.deleteMany({ student: { $in: studentIds } }, opts),
      HomeworkSubmission.deleteMany({ student: { $in: studentIds } }, opts),
      Fee.deleteMany({ student: { $in: studentIds } }, opts),
    );
    if (hwIds.length > 0) deletes.push(
      HomeworkSubmission.deleteMany({ homework: { $in: hwIds } }, opts),
      Homework.deleteMany({ _id: { $in: hwIds } }, opts),
    );
    if (examIds.length > 0) deletes.push(
      ExamResult.deleteMany({ exam: { $in: examIds } }, opts),
      Exam.deleteMany({ _id: { $in: examIds } }, opts),
    );
    await Promise.all(deletes);
  };

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => runDeletes({ session }));
    } finally {
      session.endSession();
    }
  } catch (txErr) {
    // Standalone MongoDB doesn't support transactions — fall back to non-transactional
    if (txErr.codeName === 'IllegalOperation' || txErr.message?.includes('replica set')) {
      await runDeletes();
    } else {
      return res.status(500).json({ message: txErr.message });
    }
  }

  const label = cls.section ? `${cls.name} - ${cls.section}` : cls.name;
  res.json({
    message: `"${label}" deleted along with ${studentIds.length} student(s), ${hwIds.length} homework(s), and ${examIds.length} exam(s).`,
  });
};

// PATCH /api/classes/:id
const updateClass = async (req, res) => {
  try {
    const { name, section } = req.body;
    const cleanName = stripHtml(name?.trim() || '');
    if (!cleanName) return res.status(400).json({ message: 'Class name is required' });
    if (cleanName.length > 100) return res.status(400).json({ message: 'Class name cannot exceed 100 characters' });

    const cleanSection = stripHtml(section?.trim()) || null;
    const duplicate = await Class.findOne({ name: cleanName, section: cleanSection, school: req.user.school, _id: { $ne: req.params.id } });
    if (duplicate) return res.status(409).json({ message: `Class "${cleanName}" already exists` });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      { name: cleanName, section: cleanSection || undefined },
      { new: true }
    ).populate('classTeacher', 'name mobile subject');

    if (!cls) return res.status(404).json({ message: 'Class not found' });

    res.json({ message: 'Class updated', class: cls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createClass, getAllClasses, assignTeacher, deleteClass, updateClass };
