const mongoose   = require('mongoose');
const Student    = require('../models/Student');
const Class      = require('../models/Class');
const Attendance = require('../models/Attendance');
const Exam       = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Fee        = require('../models/Fee');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared helper: enrolled students + historical fallback
async function classStudents(classId, schoolId, records, studentField = 'student') {
  const students = await Student
    .find({ enrolledClass: classId, school: schoolId, isDeleted: { $ne: true } })
    .sort({ rollNumber: 1, name: 1 })
    .select('name rollNumber parentName parentMobile dob admissionSession currentSession');

  const enrolledSet    = new Set(students.map(s => s._id.toString()));
  const historicalIds  = [...new Set(
    records.map(r => r[studentField]?.toString()).filter(id => id && !enrolledSet.has(id))
  )];
  if (historicalIds.length > 0) {
    const historical = await Student
      .find({ _id: { $in: historicalIds } })
      .select('name rollNumber parentName parentMobile dob admissionSession currentSession');
    students.push(...historical);
    students.sort((a, b) =>
      (a.rollNumber || '').localeCompare(b.rollNumber || '') || a.name.localeCompare(b.name)
    );
  }
  return students;
}

// GET /api/reports/students?classId=
const studentRoster = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'classId is required' });
    if (!isValidId(classId)) return res.status(400).json({ message: 'Invalid classId format' });

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student
      .find({ enrolledClass: classId, school: schoolId, isDeleted: { $ne: true } })
      .sort({ rollNumber: 1, name: 1 });

    res.json({
      class:    { name: cls.name, section: cls.section || null },
      students: students.map(s => ({
        rollNumber:       s.rollNumber       || '',
        name:             s.name,
        parentName:       s.parentName       || '',
        parentMobile:     s.parentMobile     || '',
        dob:              s.dob ? s.dob.toISOString().split('T')[0] : '',
        admissionSession: s.admissionSession || '',
        currentSession:   s.currentSession   || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/attendance?classId=&from=YYYY-MM-DD&to=YYYY-MM-DD
const attendanceReport = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId, from, to } = req.query;
    if (!classId || !from || !to) {
      return res.status(400).json({ message: 'classId, from, and to are required' });
    }
    if (!isValidId(classId)) return res.status(400).json({ message: 'Invalid classId format' });

    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate   = new Date(to   + 'T23:59:59.999Z');
    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ message: '"from" date must be on or before "to" date' });
    }
    const rangeMs  = toDate - fromDate;
    const maxMs    = 366 * 24 * 60 * 60 * 1000;
    if (rangeMs > maxMs) {
      return res.status(400).json({ message: 'Date range cannot exceed 366 days' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const records = await Attendance.find({
      class: classId,
      date:  { $gte: fromDate, $lte: toDate },
    });

    // Count distinct working days that were marked
    const totalDays = new Set(records.map(r => r.date.toISOString().split('T')[0])).size;

    // Per-student tallies
    const tally = {};
    records.forEach(r => {
      const id = r.student.toString();
      if (!tally[id]) tally[id] = { present: 0, absent: 0, late: 0 };
      tally[id][r.status] = (tally[id][r.status] || 0) + 1;
    });

    const students = await classStudents(classId, schoolId, records);

    res.json({
      class:     { name: cls.name, section: cls.section || null },
      from,
      to,
      totalDays,
      students: students.map(s => {
        const t       = tally[s._id.toString()] || { present: 0, absent: 0, late: 0 };
        const attended = t.present + t.late;
        return {
          rollNumber: s.rollNumber || '',
          name:       s.name,
          present:    t.present,
          late:       t.late,
          absent:     t.absent,
          totalDays,
          attended,
          percentage: totalDays > 0 ? Math.round((attended / totalDays) * 100) : 0,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/exams-list?classId=
// Returns all exams for a class so the frontend can build a picker
const examsList = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'classId is required' });
    if (!isValidId(classId)) return res.status(400).json({ message: 'Invalid classId format' });

    const exams = await Exam
      .find({ class: classId, school: schoolId })
      .select('name type examDate academicYear isPublished')
      .sort({ createdAt: -1 });

    res.json(exams.map(e => ({
      id:           e._id,
      name:         e.name,
      type:         e.type,
      examDate:     e.examDate ? e.examDate.toISOString().split('T')[0] : null,
      academicYear: e.academicYear || null,
      isPublished:  e.isPublished,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/exam-results?examId=
const examResultsReport = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ message: 'examId is required' });
    if (!isValidId(examId)) return res.status(400).json({ message: 'Invalid examId format' });

    const exam = await Exam.findOne({ _id: examId, school: schoolId })
      .populate('class', 'name section');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const results = await ExamResult.find({ exam: exam._id })
      .populate('student', 'name rollNumber')
      .sort({ createdAt: 1 });

    // Students with no result (currently enrolled, excluding deleted)
    const withResultIds = new Set(results.map(r => r.student._id.toString()));
    const enrolled = await Student
      .find({ enrolledClass: exam.class._id, school: schoolId, isDeleted: { $ne: true } })
      .select('name rollNumber')
      .sort({ rollNumber: 1 });
    const noResult = enrolled.filter(s => !withResultIds.has(s._id.toString()));

    res.json({
      exam: {
        name:         exam.name,
        type:         exam.type,
        examDate:     exam.examDate ? exam.examDate.toISOString().split('T')[0] : null,
        subjects:     exam.subjects,
        academicYear: exam.academicYear || null,
        isPublished:  exam.isPublished,
        class:        { name: exam.class.name, section: exam.class.section || null },
      },
      results: results.map(r => ({
        rollNumber:    r.student.rollNumber || '',
        name:          r.student.name,
        marks:         r.marks,
        totalObtained: r.totalObtained,
        totalMax:      r.totalMax,
        percentage:    r.percentage,
        grade:         r.grade,
      })),
      noResult: noResult.map(s => ({ rollNumber: s.rollNumber || '', name: s.name })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/fees?classId=&from=YYYY-MM&to=YYYY-MM
const feeReport = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId, from, to } = req.query;
    if (!classId || !from || !to) {
      return res.status(400).json({ message: 'classId, from, and to are required' });
    }
    if (!isValidId(classId)) return res.status(400).json({ message: 'Invalid classId format' });
    if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to)) {
      return res.status(400).json({ message: 'from and to must be YYYY-MM' });
    }
    if (from > to) {
      return res.status(400).json({ message: '"from" month must be on or before "to" month' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Enumerate months in range
    const months = [];
    let [y, m] = from.split('-').map(Number);
    const [toY, toM] = to.split('-').map(Number);
    while (y < toY || (y === toY && m <= toM)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
      if (++m > 12) { m = 1; y++; }
    }

    const records = await Fee.find({
      class: classId, school: schoolId,
      month: { $gte: from, $lte: to },
    });

    // Map: studentId → month → record
    const feeMap = {};
    records.forEach(r => {
      const id = r.student.toString();
      if (!feeMap[id]) feeMap[id] = {};
      feeMap[id][r.month] = r;
    });

    const students = await classStudents(classId, schoolId, records);

    res.json({
      class:  { name: cls.name, section: cls.section || null },
      months,
      students: students.map(s => {
        const sid      = s._id.toString();
        const monthData = months.map(mon => {
          const rec = feeMap[sid]?.[mon];
          return { month: mon, status: rec?.status || 'due', amount: rec?.amount ?? 0 };
        });
        return {
          rollNumber: s.rollNumber || '',
          name:       s.name,
          months:     monthData,
          totalPaid:  monthData.filter(d => d.status === 'paid').reduce((n, d) => n + d.amount, 0),
          paidCount:  monthData.filter(d => d.status === 'paid').length,
          dueCount:   monthData.filter(d => d.status !== 'paid').length,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/report-card?studentId=&academicYear=
const reportCard = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { studentId, academicYear } = req.query;
    if (!studentId || !academicYear) {
      return res.status(400).json({ message: 'studentId and academicYear are required' });
    }
    if (!isValidId(studentId)) return res.status(400).json({ message: 'Invalid studentId format' });

    const student = await Student
      .findOne({ _id: studentId, school: schoolId })
      .populate('enrolledClass', 'name section');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Derive attendance date range from academicYear "YYYY-YY" (June to May)
    const startYear = parseInt(academicYear.split('-')[0]);
    const fromDate  = new Date(`${startYear}-06-01T00:00:00.000Z`);
    const toDate    = new Date(`${startYear + 1}-05-31T23:59:59.999Z`);

    // All published exams in this school+academicYear (student may have been in a different class)
    const exams = await Exam
      .find({ school: schoolId, academicYear, isPublished: true })
      .sort({ examDate: 1, createdAt: 1 });

    const results = await ExamResult.find({
      student: studentId,
      exam:    { $in: exams.map(e => e._id) },
    });
    const resultMap = {};
    results.forEach(r => { resultMap[r.exam.toString()] = r; });

    const examData = exams
      .filter(e => resultMap[e._id.toString()])
      .map(e => {
        const r = resultMap[e._id.toString()];
        return {
          name:          e.name,
          type:          e.type,
          examDate:      e.examDate ? e.examDate.toISOString().split('T')[0] : null,
          marks:         r.marks,
          totalObtained: r.totalObtained,
          totalMax:      r.totalMax,
          percentage:    r.percentage,
          grade:         r.grade,
        };
      });

    // Attendance scoped to this academic year's date range
    const attendanceRecords = await Attendance.find({
      student: studentId,
      school:  schoolId,
      date:    { $gte: fromDate, $lte: toDate },
    });
    const tally = { present: 0, absent: 0, late: 0 };
    attendanceRecords.forEach(r => { tally[r.status] = (tally[r.status] || 0) + 1; });
    const totalDays = attendanceRecords.length;
    const attended  = tally.present + tally.late;

    res.json({
      student: {
        name:             student.name,
        rollNumber:       student.rollNumber       || '',
        parentName:       student.parentName       || '',
        dob:              student.dob ? student.dob.toISOString().split('T')[0] : '',
        admissionSession: student.admissionSession || '',
        currentSession:   student.currentSession   || '',
        class: {
          name:    student.enrolledClass.name,
          section: student.enrolledClass.section || null,
        },
      },
      academicYear,
      exams: examData,
      attendance: {
        present:    tally.present,
        absent:     tally.absent,
        late:       tally.late,
        totalDays,
        attended,
        percentage: totalDays > 0 ? Math.round((attended / totalDays) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { studentRoster, attendanceReport, examsList, examResultsReport, feeReport, reportCard };
