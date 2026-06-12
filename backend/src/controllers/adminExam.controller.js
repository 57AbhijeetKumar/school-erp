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

function currentAcademicYear() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth(); // 0-indexed; 5 = June (start of new academic year)
  if (month >= 5) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

// POST /api/exams
const createExam = async (req, res) => {
  try {
    const { name, type, classId, subjects, examDate, academicYear } = req.body;
    const schoolId = req.user.school;

    const EXAM_TYPES = ['unit_test', 'quarterly', 'half_yearly', 'pre_board', 'annual'];
    if (!name || !type || !classId || !subjects?.length) {
      return res.status(400).json({ message: 'name, type, classId and subjects are required' });
    }
    if (name.trim().length > 200) return res.status(400).json({ message: 'Exam name cannot exceed 200 characters' });
    if (!EXAM_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${EXAM_TYPES.join(', ')}` });
    }
    if (academicYear && !/^\d{4}-\d{2}$/.test(academicYear)) {
      return res.status(400).json({ message: 'academicYear must be in YYYY-YY format (e.g. 2024-25)' });
    }

    const badSubject = subjects.find(s => !s.name?.trim() || Number(s.maxMarks) <= 0);
    if (badSubject) {
      return res.status(400).json({ message: 'Each subject must have a name and maxMarks greater than 0' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Prevent scheduling two exams for the same class on the same date
    if (examDate) {
      const dayStart = new Date(examDate + 'T00:00:00.000Z');
      const dayEnd   = new Date(examDate + 'T23:59:59.999Z');
      const duplicate = await Exam.findOne({
        class: classId, school: schoolId,
        examDate: { $gte: dayStart, $lte: dayEnd },
      });
      if (duplicate) {
        return res.status(409).json({
          message: `"${duplicate.name}" is already scheduled for this class on that date`,
        });
      }
    }

    const exam = await Exam.create({
      name:         name.trim(),
      type,
      class:        classId,
      school:       schoolId,
      subjects:     subjects.map(s => ({ name: s.name.trim(), maxMarks: Number(s.maxMarks) || 100 })),
      examDate:     examDate || undefined,
      academicYear: academicYear || currentAcademicYear(),
      createdBy:    req.user.id,
    });

    res.status(201).json({ message: 'Exam created', exam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exams?page=1&limit=20&classId=...
const getExams = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const filter = { school: schoolId };
    if (req.query.classId) filter.class = req.query.classId;

    const [exams, total] = await Promise.all([
      Exam.find(filter).populate('class', 'name section').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Exam.countDocuments(filter),
    ]);

    // Count results per exam to know if marks are entered
    const examIds = exams.map(e => e._id);
    const resultCounts = await ExamResult.aggregate([
      { $match: { exam: { $in: examIds } } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    resultCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

    res.json({
      data: exams.map(e => ({
        id:          e._id,
        name:        e.name,
        type:        e.type,
        class:       { id: e.class._id, name: e.class.name, section: e.class.section || null },
        subjects:    e.subjects,
        examDate:    e.examDate ? e.examDate.toISOString().split('T')[0] : null,
        isPublished: e.isPublished,
        marksEntered: (countMap[e._id.toString()] || 0) > 0,
        createdAt:   e.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exams/:id/results
const getExamResults = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId })
      .populate('class', 'name section');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const results = await ExamResult.find({ exam: exam._id })
      .populate('student', 'name rollNumber')
      .sort({ 'student.rollNumber': 1 });

    res.json({
      exam: {
        id:          exam._id,
        name:        exam.name,
        type:        exam.type,
        class:       { id: exam.class._id, name: exam.class.name, section: exam.class.section || null },
        subjects:    exam.subjects,
        examDate:    exam.examDate ? exam.examDate.toISOString().split('T')[0] : null,
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

// PATCH /api/exams/:id/unpublish
const unpublishExam = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!exam.isPublished) return res.status(400).json({ message: 'Exam is not published' });

    exam.isPublished = false;
    await exam.save();
    res.json({ message: 'Result unpublished' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/exams/:id/publish
const publishExam = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.isPublished) return res.status(400).json({ message: 'Already published' });

    const resultCount = await ExamResult.countDocuments({ exam: exam._id });
    if (resultCount === 0) return res.status(400).json({ message: 'No marks entered yet' });

    exam.isPublished = true;
    await exam.save();
    res.json({ message: 'Result published successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/exams/:id
const deleteExam = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.isPublished) return res.status(400).json({ message: 'Cannot delete a published exam' });

    await ExamResult.deleteMany({ exam: exam._id });
    await exam.deleteOne();
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/exams/:id
const updateExam = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.isPublished) return res.status(400).json({ message: 'Cannot edit a published exam' });

    const { name, examDate, subjects } = req.body;
    if (name)     exam.name     = name.trim();
    if (examDate !== undefined) exam.examDate = examDate ? new Date(examDate) : undefined;

    const hasResults = await ExamResult.countDocuments({ exam: exam._id });
    if (subjects?.length && !hasResults) {
      const badSubject = subjects.find(s => !s.name?.trim() || Number(s.maxMarks) <= 0);
      if (badSubject) return res.status(400).json({ message: 'Each subject must have a name and maxMarks > 0' });
      exam.subjects = subjects.map(s => ({ name: s.name.trim(), maxMarks: Number(s.maxMarks) }));
    }

    await exam.save();
    res.json({ message: 'Exam updated', exam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/exams/:id/marks  (admin enters marks)
const adminEnterMarks = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId })
      .populate('class', 'name section');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.isPublished) return res.status(400).json({ message: 'Cannot edit marks of a published exam' });

    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'results array is required' });
    }

    // Validate student belongs to this school (not enrollment-based — allows promoted students)
    const schoolStudentIds = await Student.find({ school: schoolId, isDeleted: { $ne: true } }).distinct('_id');
    const validSet = new Set(schoolStudentIds.map(id => id.toString()));

    const totalMax = exam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);

    for (const entry of results) {
      if (!validSet.has(entry.studentId?.toString())) continue;
      if (!Array.isArray(entry.marks)) continue;

      const marks = [];
      for (const sub of exam.subjects) {
        const m = entry.marks.find(x => x.subject === sub.name);
        const raw = Number(m?.obtained ?? 0);
        if (isNaN(raw) || raw < 0) {
          return res.status(400).json({ message: `${sub.name}: marks must be a non-negative number` });
        }
        if (raw > sub.maxMarks) {
          return res.status(400).json({
            message: `${sub.name}: marks entered (${raw}) cannot exceed maximum (${sub.maxMarks})`,
          });
        }
        marks.push({ subject: sub.name, obtained: raw, maxMarks: sub.maxMarks });
      }

      const totalObtained = marks.reduce((s, m) => s + m.obtained, 0);
      const percentage    = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;
      const grade         = calcGrade(percentage);

      await ExamResult.findOneAndUpdate(
        { exam: exam._id, student: entry.studentId },
        { exam: exam._id, student: entry.studentId, class: exam.class._id, school: schoolId,
          marks, totalObtained, totalMax, percentage, grade },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Marks saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exams/:id/students  (fetch students for marks entry UI)
const getExamStudents = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const exam = await Exam.findOne({ _id: req.params.id, school: schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const students = await Student.find({ enrolledClass: exam.class, school: schoolId, isDeleted: { $ne: true } })
      .select('name rollNumber')
      .sort({ rollNumber: 1 });

    const existingResults = await ExamResult.find({ exam: exam._id });
    const resultMap = {};
    existingResults.forEach(r => { resultMap[r.student.toString()] = r.marks; });

    // Include students promoted out but who already have result records for this exam
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

    res.json(students.map(s => ({
      id:         s._id,
      name:       s.name,
      rollNumber: s.rollNumber || null,
      marks:      resultMap[s._id.toString()] || [],
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createExam, getExams, getExamResults, publishExam, unpublishExam, deleteExam, updateExam, adminEnterMarks, getExamStudents };
