const Student            = require('../models/Student');
const Class              = require('../models/Class');
const Attendance         = require('../models/Attendance');
const ExamResult         = require('../models/ExamResult');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Fee                = require('../models/Fee');

const addStudent = async (req, res) => {
  try {
    const { name, rollNumber, parentName, parentMobile, dob, classId, admissionSession } = req.body;
    const schoolId  = req.user.school;
    const roll      = rollNumber?.trim() || undefined;

    if (!name || !classId) {
      return res.status(400).json({ message: 'Student name and classId are required' });
    }
    if (dob && new Date(dob) > new Date()) {
      return res.status(400).json({ message: 'Date of birth cannot be in the future' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found in your school' });

    if (roll) {
      const duplicate = await Student.findOne({
        school: schoolId, enrolledClass: classId, rollNumber: roll, isDeleted: { $ne: true },
      }).select('name');
      if (duplicate) {
        return res.status(409).json({
          message: `Roll number "${roll}" is already assigned to "${duplicate.name}" in this class`,
        });
      }
    }

    const session = admissionSession?.trim() || undefined;

    const student = await Student.create({
      name:             name.trim(),
      rollNumber:       roll,
      parentName:       parentName?.trim()   || undefined,
      parentMobile:     parentMobile?.trim() || undefined,
      dob:              dob                  || undefined,
      enrolledClass:    classId,
      school:           schoolId,
      admissionSession: session,
      currentSession:   session,
    });

    res.status(201).json({ message: 'Student added', student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This roll number is already taken in this class' });
    }
    res.status(500).json({ message: err.message });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const students = await Student.find({
      enrolledClass: req.params.classId,
      school:        req.user.school,
      isDeleted:     { $ne: true },
    }).sort({ rollNumber: 1, name: 1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, parentName, parentMobile, dob, classId } = req.body;
    const schoolId = req.user.school;
    const roll     = rollNumber?.trim() || null;

    if (!name?.trim()) return res.status(400).json({ message: 'Student name is required' });

    if (parentMobile && !/^\d{10}$/.test(parentMobile.trim())) {
      return res.status(400).json({ message: 'Parent mobile must be 10 digits' });
    }
    if (dob && new Date(dob) > new Date()) {
      return res.status(400).json({ message: 'Date of birth cannot be in the future' });
    }

    if (classId) {
      const cls = await Class.findOne({ _id: classId, school: schoolId });
      if (!cls) return res.status(404).json({ message: 'Class not found in your school' });
    }

    if (roll) {
      // Determine which class to check: the new one (if moving) or the current one
      const current = await Student.findOne(
        { _id: req.params.id, school: schoolId, isDeleted: { $ne: true } }
      ).select('enrolledClass');
      if (!current) return res.status(404).json({ message: 'Student not found' });

      const targetClass = classId || current.enrolledClass;
      const duplicate = await Student.findOne({
        school:        schoolId,
        enrolledClass: targetClass,
        rollNumber:    roll,
        isDeleted:     { $ne: true },
        _id:           { $ne: req.params.id },
      }).select('name');
      if (duplicate) {
        return res.status(409).json({
          message: `Roll number "${roll}" is already assigned to "${duplicate.name}" in this class`,
        });
      }
    }

    const updateFields = {
      name:         name.trim(),
      rollNumber:   roll,
      parentName:   parentName?.trim()   || null,
      parentMobile: parentMobile?.trim() || null,
      dob:          dob || null,
    };
    if (classId) updateFields.enrolledClass = classId;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, school: schoolId, isDeleted: { $ne: true } },
      { $set: updateFields },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ message: 'Student updated', student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This roll number is already taken in this class' });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/students/:id/delete-info
// Returns record counts that will be archived when the student is soft-deleted.
const getStudentDeleteInfo = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, school: req.user.school, isDeleted: { $ne: true } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const [attendance, exams, homework, fees] = await Promise.all([
      Attendance.countDocuments({ student: student._id }),
      ExamResult.countDocuments({ student: student._id }),
      HomeworkSubmission.countDocuments({ student: student._id }),
      Fee.countDocuments({ student: student._id }),
    ]);

    res.json({
      studentId: student._id,
      name:      student.name,
      counts:    { attendance, exams, homework, fees },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/students/:id
// Soft-delete: marks isDeleted=true so historical records (attendance, results, fees) are preserved.
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: false }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ message: `Student "${student.name}" archived` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/students/promote
// Body: { studentIds, toClassId, toSession }
// Updates enrolledClass + currentSession for selected students.
// Historical records (Attendance, ExamResult, etc.) remain linked to the old class
// and are still accessible via the historical fallback queries added in Phase 0.
const promoteStudents = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { studentIds, toClassId, toSession } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'studentIds array is required' });
    }
    if (!toClassId) return res.status(400).json({ message: 'toClassId is required' });
    if (!toSession)  return res.status(400).json({ message: 'toSession is required' });

    // Prevent promoting students back to the same class they are already in.
    const sameClassCount = await Student.countDocuments({
      _id: { $in: studentIds }, school: schoolId, enrolledClass: toClassId,
    });
    if (sameClassCount > 0) {
      return res.status(400).json({ message: 'Cannot promote students to their current class' });
    }

    const toClass = await Class.findOne({ _id: toClassId, school: schoolId });
    if (!toClass) return res.status(404).json({ message: 'Destination class not found in your school' });

    const result = await Student.updateMany(
      { _id: { $in: studentIds }, school: schoolId },
      { $set: { enrolledClass: toClassId, currentSession: toSession } }
    );

    const label = toClass.section ? `${toClass.name} — ${toClass.section}` : toClass.name;
    res.json({
      message:  `${result.modifiedCount} student(s) promoted to ${label} for session ${toSession}`,
      promoted: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addStudent, getStudentsByClass, updateStudent, deleteStudent, getStudentDeleteInfo, promoteStudents };
