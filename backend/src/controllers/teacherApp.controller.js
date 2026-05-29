const Class   = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

/**
 * GET /api/app/my-class
 * Mobile app endpoint — returns the class where this teacher is class teacher,
 * along with the full student list.
 */
const getMyClass = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    // Look up teacher profile for the response
    const teacher = await Teacher.findById(teacherId).select('-password');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // Check if this teacher is a class teacher of any class
    const cls = await Class.findOne({ classTeacher: teacherId, school: schoolId });

    if (!cls) {
      return res.json({
        teacher: { id: teacher._id, name: teacher.name, mobile: teacher.mobile, subject: teacher.subject },
        isClassTeacher: false,
        class:    null,
        students: [],
      });
    }

    const students = await Student.find({ enrolledClass: cls._id, isDeleted: { $ne: true } })
      .sort({ rollNumber: 1, name: 1 })
      .select('name rollNumber parentName parentMobile');

    res.json({
      teacher: { id: teacher._id, name: teacher.name, mobile: teacher.mobile, subject: teacher.subject },
      isClassTeacher: true,
      class: { id: cls._id, name: cls.name, section: cls.section || null },
      students: students.map(s => ({
        id:           s._id,
        name:         s.name,
        rollNumber:   s.rollNumber   || null,
        parentName:   s.parentName   || null,
        parentMobile: s.parentMobile || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyClass };
