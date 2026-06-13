const Attendance = require('../models/Attendance');
const Class      = require('../models/Class');
const Student    = require('../models/Student');

// GET /api/attendance/class/:classId?date=YYYY-MM-DD
const getClassAttendance = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const cls = await Class.findOne({ _id: req.params.classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: 'date must be in YYYY-MM-DD format' });
    }
    const attendanceDate = new Date(dateStr + 'T00:00:00.000Z');

    const students = await Student
      .find({
        enrolledClass: cls._id,
        school:        schoolId,
        isDeleted:     { $ne: true },
        createdAt:     { $lte: new Date(dateStr + 'T23:59:59.999Z') },
      })
      .sort({ rollNumber: 1, name: 1 })
      .select('name rollNumber');

    const records = await Attendance.find({ class: cls._id, date: attendanceDate });
    const recordMap = {};
    records.forEach(r => { recordMap[r.student.toString()] = r.status; });

    // Include students who were promoted out but have attendance records for this class/date
    const enrolledSet = new Set(students.map(s => s._id.toString()));
    const historicalIds = [...new Set(
      records.map(r => r.student.toString()).filter(id => !enrolledSet.has(id))
    )];
    if (historicalIds.length > 0) {
      const historical = await Student.find({ _id: { $in: historicalIds }, isDeleted: { $ne: true } }).select('name rollNumber');
      students.push(...historical);
      students.sort((a, b) => {
        const r = (a.rollNumber || '').localeCompare(b.rollNumber || '');
        return r !== 0 ? r : a.name.localeCompare(b.name);
      });
    }

    const presentCount = records.filter(r => r.status === 'present').length;

    res.json({
      date:         dateStr,
      class:        { id: cls._id, name: cls.name, section: cls.section || null },
      isMarked:     records.length > 0,
      presentCount,
      absentCount:  records.filter(r => r.status === 'absent').length,
      totalCount:   students.length,
      records:      students.map(s => ({
        studentId:  s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        status:     recordMap[s._id.toString()] || 'not-marked',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/class/:classId/dates — last 30 days summary
const getAttendanceDates = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const cls = await Class.findOne({ _id: req.params.classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dates = await Attendance.aggregate([
      { $match: { class: cls._id, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id:          '$date',
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          totalCount:   { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    res.json(dates.map(d => ({
      date:         d._id.toISOString().split('T')[0],
      presentCount: d.presentCount,
      totalCount:   d.totalCount,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/class/:classId
// Admin fallback: mark or override attendance for any class when the class teacher is absent.
// markedBy stores the admin's user ID (admin User doc, not Teacher doc — populate not used here).
const markClassAttendance = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { date, records } = req.body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'date and records are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'date must be in YYYY-MM-DD format' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return res.status(400).json({ message: 'Cannot mark attendance for a future date' });
    }

    const dayOfWeek = new Date(date + 'T00:00:00.000Z').getDay(); // 0 = Sunday
    if (dayOfWeek === 0) {
      return res.status(400).json({ message: 'Cannot mark attendance on Sunday' });
    }

    const VALID = ['present', 'absent', 'late'];
    const bad = records.find(r => !VALID.includes(r.status));
    if (bad) return res.status(400).json({ message: `Invalid status "${bad.status}"` });

    const cls = await Class.findOne({ _id: req.params.classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Validate every studentId belongs to this school to prevent cross-school injection
    const submittedIds = records.map(r => r.studentId);
    const validStudents = await Student.find(
      { _id: { $in: submittedIds }, school: schoolId },
    ).distinct('_id');
    const validSet = new Set(validStudents.map(id => id.toString()));
    const invalid = submittedIds.find(id => !validSet.has(id?.toString()));
    if (invalid) {
      return res.status(400).json({ message: 'One or more students do not belong to this school' });
    }

    const attendanceDate = new Date(date + 'T00:00:00.000Z');

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { date: attendanceDate, student: studentId },
        update: {
          $set: {
            date:          attendanceDate,
            student:       studentId,
            class:         cls._id,
            school:        schoolId,
            status,
            markedBy:      req.user.id,
            markedByModel: 'User',
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClassAttendance, getAttendanceDates, markClassAttendance };
