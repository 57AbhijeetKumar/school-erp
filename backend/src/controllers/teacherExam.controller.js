const Exam       = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Class      = require('../models/Class');
const Student    = require('../models/Student');

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

// GET /api/app/exams  — all exams in school visible to every teacher
const getMyExams = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    // Determine if teacher is class teacher (to know which class they can enter marks for)
    const myClass = await Class.findOne({ classTeacher: teacherId, school: schoolId });

    const examFilter = myClass
      ? { school: schoolId, class: myClass._id }          // class teacher: own class only
      : { school: schoolId, isPublished: true };          // other teachers: published only
    const exams = await Exam.find(examFilter)
      .populate('class', 'name section')
      .sort({ createdAt: -1 });

    const examIds = exams.map(e => e._id);
    const resultCounts = await ExamResult.aggregate([
      { $match: { exam: { $in: examIds } } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    resultCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

    res.json(exams.map(e => ({
      id:           e._id,
      name:         e.name,
      type:         e.type,
      class:        { id: e.class._id, name: e.class.name, section: e.class.section || null },
      subjects:     e.subjects,
      examDate:     e.examDate ? e.examDate.toISOString().split('T')[0] : null,
      isPublished:   e.isPublished,
      marksEntered:  (countMap[e._id.toString()] || 0) > 0,
      canEnterMarks: myClass
        ? String(myClass._id) === String(e.class._id) && !e.isPublished
        : false,
      // Class teacher can view their results any time; others only after publish
      canViewResults: myClass
        ? String(myClass._id) === String(e.class._id) && (countMap[e._id.toString()] || 0) > 0
        : e.isPublished && (countMap[e._id.toString()] || 0) > 0,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/exams/:id/marks  — load exam + existing marks for entry screen
const getExamForMarks = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Only class teacher of this exam's class can access this
    const myClass = await Class.findOne({ classTeacher: teacherId, school: schoolId, _id: exam.class });
    if (!myClass) return res.status(403).json({ message: 'Not authorised to enter marks for this exam' });

    const students = await Student
      .find({ enrolledClass: exam.class, school: schoolId, isDeleted: { $ne: true } })
      .sort({ rollNumber: 1, name: 1 })
      .select('name rollNumber');

    const existingResults = await ExamResult.find({ exam: exam._id });
    const resultMap = {};
    existingResults.forEach(r => { resultMap[r.student.toString()] = r.marks; });

    // Include students promoted out but with existing result records for this exam
    const enrolledSet = new Set(students.map(s => s._id.toString()));
    const historicalIds = [...new Set(
      existingResults.map(r => r.student.toString()).filter(id => !enrolledSet.has(id))
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
      exam: {
        id:       exam._id,
        name:     exam.name,
        type:     exam.type,
        subjects: exam.subjects,
        examDate: exam.examDate ? exam.examDate.toISOString().split('T')[0] : null,
      },
      students: students.map(s => ({
        studentId:  s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        marks: exam.subjects.map(sub => {
          const existing = resultMap[s._id.toString()]?.find(m => m.subject === sub.name);
          return {
            subject:  sub.name,
            maxMarks: sub.maxMarks,
            obtained: existing ? existing.obtained : null,
          };
        }),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/app/exams/:id/marks  — submit/update marks for all students
const submitMarks = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;
    const { results } = req.body;   // [{ studentId, marks: [{ subject, obtained }] }]

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'results array is required' });
    }

    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.isPublished) return res.status(400).json({ message: 'Cannot edit marks after publishing' });

    const myClass = await Class.findOne({ classTeacher: teacherId, school: schoolId, _id: exam.class });
    if (!myClass) return res.status(403).json({ message: 'Not authorised' });

    // Build the set of valid student IDs: enrolled students + those with existing results
    const [enrolled, existing] = await Promise.all([
      Student.find({ enrolledClass: exam.class, school: schoolId, isDeleted: { $ne: true } }).distinct('_id'),
      ExamResult.find({ exam: exam._id }).distinct('student'),
    ]);
    const allowedIds = new Set([
      ...enrolled.map(id => id.toString()),
      ...existing.map(id => id.toString()),
    ]);

    const validResults = results.filter(r => allowedIds.has(r.studentId?.toString()));
    if (validResults.length === 0) {
      return res.status(400).json({ message: 'No valid students found in results' });
    }

    const ops = validResults.map(({ studentId, marks }) => {
      const totalMax = exam.subjects.reduce((s, sub) => s + sub.maxMarks, 0);

      const marksArr = exam.subjects.map(sub => {
        const entry   = marks.find(m => m.subject === sub.name);
        const obtained = Math.min(Math.max(Number(entry?.obtained) || 0, 0), sub.maxMarks);
        return { subject: sub.name, obtained, maxMarks: sub.maxMarks };
      });

      const totalObtained = marksArr.reduce((s, m) => s + m.obtained, 0);
      const percentage    = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;
      const grade         = calcGrade(percentage);

      return {
        updateOne: {
          filter: { exam: exam._id, student: studentId },
          update: {
            $set: {
              exam: exam._id, student: studentId, class: exam.class, school: schoolId,
              marks: marksArr, totalObtained, totalMax, percentage, grade,
              enteredBy: teacherId,
            },
          },
          upsert: true,
        },
      };
    });

    await ExamResult.bulkWrite(ops);
    res.json({ message: 'Marks saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/exams/:id/results  — class teacher anytime, others only after publish
const getExamResults = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const myClass = await Class.findOne({ classTeacher: teacherId, school: schoolId, _id: exam.class });
    const isClassTeacher = !!myClass;

    if (!isClassTeacher && !exam.isPublished) {
      return res.status(403).json({ message: 'Results are not published yet' });
    }

    const results = await ExamResult.find({ exam: exam._id })
      .populate('student', 'name rollNumber')
      .sort({ createdAt: 1 });

    res.json({
      exam: {
        id:          exam._id,
        name:        exam.name,
        type:        exam.type,
        subjects:    exam.subjects,
        isPublished: exam.isPublished,
      },
      results: results.map(r => ({
        studentId:     r.student._id,
        name:          r.student.name,
        rollNumber:    r.student.rollNumber || null,
        marks:         r.marks,
        totalObtained: r.totalObtained,
        totalMax:      r.totalMax,
        percentage:    r.percentage,
        grade:         r.grade,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyExams, getExamForMarks, submitMarks, getExamResults };
