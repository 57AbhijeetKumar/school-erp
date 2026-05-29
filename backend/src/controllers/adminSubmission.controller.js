const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Student            = require('../models/Student');

// GET /api/homework/:homeworkId/submissions  — admin read-only
const getHomeworkSubmissions = async (req, res) => {
  try {
    const schoolId = req.user.school;

    const hw = await Homework.findOne({ _id: req.params.homeworkId, school: schoolId })
      .populate('class',      'name section')
      .populate('assignedBy', 'name');
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    const students = await Student
      .find({ enrolledClass: hw.class._id, school: schoolId, isDeleted: { $ne: true } })
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

    const list = students.map(s => ({
      studentId:  s._id,
      name:       s.name,
      rollNumber: s.rollNumber || null,
      status:     map[s._id.toString()]?.status || 'not_submitted',
      remark:     map[s._id.toString()]?.remark || '',
    }));

    res.json({
      homework: {
        id: hw._id, title: hw.title, subject: hw.subject || null,
        dueDate: hw.dueDate ? hw.dueDate.toISOString().split('T')[0] : null,
        class: { id: hw.class._id, name: hw.class.name, section: hw.class.section || null },
        assignedBy: { id: hw.assignedBy._id, name: hw.assignedBy.name },
      },
      summary: {
        total:        list.length,
        submitted:    list.filter(s => s.status === 'submitted').length,
        notSubmitted: list.filter(s => s.status === 'not_submitted').length,
        late:         list.filter(s => s.status === 'late').length,
      },
      students: list,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getHomeworkSubmissions };
