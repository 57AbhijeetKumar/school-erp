const Student            = require('../models/Student');
const Attendance         = require('../models/Attendance');
const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Exam               = require('../models/Exam');
const ExamResult         = require('../models/ExamResult');
const Fee                = require('../models/Fee');

// Verify the student is in the parent's JWT-bound allowed list AND mobile matches.
// Using the JWT studentIds list prevents cross-parent access even if mobiles overlap.
async function verifiedStudent(studentId, parent) {
  const allowed = Array.isArray(parent.studentIds) ? parent.studentIds : [];
  if (!allowed.includes(studentId?.toString())) return null;
  return Student.findOne({ _id: studentId, parentMobile: parent.mobile, isDeleted: { $ne: true } })
    .populate('enrolledClass', 'name section')
    .populate('school', 'name');
}

// GET /api/parent/children
const getChildren = async (req, res) => {
  try {
    const allowed  = Array.isArray(req.parent.studentIds) ? req.parent.studentIds : [];
    const students = await Student
      .find({ _id: { $in: allowed }, parentMobile: req.parent.mobile })
      .populate('enrolledClass', 'name section')
      .populate('school', 'name')
      .select('name rollNumber enrolledClass school');

    res.json(students.map(s => ({
      studentId:  s._id,
      name:       s.name,
      rollNumber: s.rollNumber || null,
      className:  s.enrolledClass?.name    || '',
      section:    s.enrolledClass?.section || null,
      school:     s.school?.name           || '',
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/attendance?month=YYYY-MM
const getChildAttendance = async (req, res) => {
  try {
    const student = await verifiedStudent(req.params.studentId, req.parent);
    if (!student) return res.status(403).json({ message: 'Access denied' });

    const month = req.query.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required (YYYY-MM)' });
    }

    const [yr, mo]  = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(yr, mo - 1, 1));
    const endDate   = new Date(Date.UTC(yr, mo,     1));

    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    const present = records.filter(r => r.status === 'present').length;
    const absent  = records.filter(r => r.status === 'absent').length;

    res.json({
      studentId: student._id,
      name:      student.name,
      month,
      summary:   { total: records.length, present, absent },
      records:   records.map(r => ({
        date:   r.date.toISOString().split('T')[0],
        status: r.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/homework
const getChildHomework = async (req, res) => {
  try {
    const student = await verifiedStudent(req.params.studentId, req.parent);
    if (!student) return res.status(403).json({ message: 'Access denied' });

    const classId = student.enrolledClass?._id;

    // Current class homework
    const currentHomeworks = classId
      ? await Homework.find({ class: classId }).populate('assignedBy', 'name').sort({ createdAt: -1 })
      : [];

    // Historical homework from previous classes via submission records
    const submittedHwIds = await HomeworkSubmission.find({ student: student._id }).distinct('homework');
    const currentHwSet   = new Set(currentHomeworks.map(h => h._id.toString()));
    const oldHwIds       = submittedHwIds.filter(id => !currentHwSet.has(id.toString()));
    const oldHomeworks   = oldHwIds.length > 0
      ? await Homework.find({ _id: { $in: oldHwIds } }).populate('assignedBy', 'name').sort({ createdAt: -1 })
      : [];

    const homeworks = [...currentHomeworks, ...oldHomeworks]
      .sort((a, b) => b.createdAt - a.createdAt);

    const hwIds = homeworks.map(h => h._id);
    const submissions = await HomeworkSubmission.find({
      homework: { $in: hwIds },
      student:  student._id,
    });
    const subMap = {};
    submissions.forEach(s => { subMap[s.homework.toString()] = s; });

    res.json(homeworks.map(h => {
      const sub = subMap[h._id.toString()];
      return {
        id:          h._id,
        title:       h.title,
        description: h.description,
        subject:     h.subject || null,
        dueDate:     h.dueDate ? h.dueDate.toISOString().split('T')[0] : null,
        assignedBy:  h.assignedBy?.name || 'Unknown',
        status:      sub?.status || 'not_submitted',
        remark:      sub?.remark || null,
        attachments: h.attachments || [],
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/exams
// Returns ALL exams for the student's class.
// For published exams the student's result is merged in; unpublished exams show subjects/date only.
const getChildExams = async (req, res) => {
  try {
    const student = await verifiedStudent(req.params.studentId, req.parent);
    if (!student) return res.status(403).json({ message: 'Access denied' });

    const classId = student.enrolledClass?._id;

    // Current class exams
    const currentExams = classId
      ? await Exam.find({ class: classId }).sort({ examDate: -1, createdAt: -1 })
      : [];

    // Historical exams from previous classes via result records
    const resultExamIds   = await ExamResult.find({ student: student._id }).distinct('exam');
    const currentExamSet  = new Set(currentExams.map(e => e._id.toString()));
    const oldExamIds      = resultExamIds.filter(id => !currentExamSet.has(id.toString()));
    const oldExams        = oldExamIds.length > 0
      ? await Exam.find({ _id: { $in: oldExamIds } }).sort({ examDate: -1, createdAt: -1 })
      : [];

    const exams = [...currentExams, ...oldExams]
      .sort((a, b) => ((b.examDate || b.createdAt) - (a.examDate || a.createdAt)));

    // Fetch this student's results for all exams in one query
    const examIds = exams.map(e => e._id);
    const results = await ExamResult.find({ exam: { $in: examIds }, student: student._id });
    const resultMap = {};
    results.forEach(r => { resultMap[r.exam.toString()] = r; });

    res.json(exams.map(e => {
      const result = e.isPublished ? resultMap[e._id.toString()] : null;
      return {
        examId:      e._id,
        examName:    e.name,
        examType:    e.type,
        examDate:    e.examDate ? e.examDate.toISOString().split('T')[0] : null,
        subjects:    e.subjects.map(s => ({ name: s.name, maxMarks: s.maxMarks })),
        isPublished: e.isPublished,
        result: result ? {
          marks:         result.marks         || [],
          totalObtained: result.totalObtained || 0,
          totalMax:      result.totalMax      || 0,
          percentage:    result.percentage    || 0,
          grade:         result.grade         || 'N/A',
        } : null,
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/fees
const getChildFees = async (req, res) => {
  try {
    const student = await verifiedStudent(req.params.studentId, req.parent);
    if (!student) return res.status(403).json({ message: 'Access denied' });

    const fees = await Fee.find({ student: student._id }).sort({ month: -1 });

    res.json({
      studentId: student._id,
      name:      student.name,
      fees: fees.map(f => ({
        month:  f.month,
        status: f.status,
        amount: f.amount,
        paidAt: f.paidAt || null,
        note:   f.note   || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getChildren, getChildAttendance, getChildHomework, getChildExams, getChildFees };
