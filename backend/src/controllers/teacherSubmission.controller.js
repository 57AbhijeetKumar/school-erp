const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Class              = require('../models/Class');
const Student            = require('../models/Student');

// GET /api/app/homework/:id/submissions
// assignedBy teacher → canMark true  |  class teacher of that class → view only
const getSubmissions = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const hw = await Homework.findOne({ _id: req.params.id, school: schoolId });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    const isAssigner   = String(hw.assignedBy) === teacherId;
    const myClass      = await Class.findOne({ classTeacher: teacherId, school: schoolId });
    const isClassTeacherOfClass = myClass && String(myClass._id) === String(hw.class);

    if (!isAssigner && !isClassTeacherOfClass) {
      return res.status(403).json({ message: 'Not authorised to view these submissions' });
    }

    const students = await Student
      .find({ enrolledClass: hw.class, school: schoolId, isDeleted: { $ne: true } })
      .sort({ rollNumber: 1, name: 1 })
      .select('name rollNumber');

    const existing = await HomeworkSubmission.find({ homework: hw._id });
    const map = {};
    existing.forEach(s => { map[s.student.toString()] = { status: s.status, remark: s.remark || '' }; });

    // Include students promoted out but with submission records for this homework
    const enrolledSet = new Set(students.map(s => s._id.toString()));
    const historicalIds = [...new Set(
      existing.map(s => s.student.toString()).filter(id => !enrolledSet.has(id))
    )];
    if (historicalIds.length > 0) {
      const historical = await Student.find({ _id: { $in: historicalIds }, isDeleted: { $ne: true } }).select('name rollNumber');
      students.push(...historical);
      students.sort((a, b) => {
        const r = (a.rollNumber || '').localeCompare(b.rollNumber || '');
        return r !== 0 ? r : a.name.localeCompare(b.name);
      });
    }

    res.json({
      homeworkId: hw._id,
      title:      hw.title,
      canMark:    isAssigner,
      students:   students.map(s => ({
        studentId:  s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        status:     map[s._id.toString()]?.status || 'not_submitted',
        remark:     map[s._id.toString()]?.remark || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/app/homework/:id/submissions
// Body: { submissions: [{ studentId, status, remark? }] }
// Only the teacher who assigned it can call this
const markSubmissions = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const hw = await Homework.findOne({ _id: req.params.id, school: schoolId });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    if (String(hw.assignedBy) !== teacherId) {
      return res.status(403).json({ message: 'Only the assigning teacher can mark submissions' });
    }

    const { submissions } = req.body;
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ message: 'submissions array is required' });
    }

    const ops = submissions.map(({ studentId, status, remark }) => ({
      updateOne: {
        filter: { homework: hw._id, student: studentId },
        update: { $set: { homework: hw._id, student: studentId, class: hw.class, school: schoolId, status: status || 'not_submitted', markedBy: teacherId, remark: remark?.trim() || '' } },
        upsert: true,
      },
    }));

    await HomeworkSubmission.bulkWrite(ops);
    res.json({ message: 'Submissions saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSubmissions, markSubmissions };
