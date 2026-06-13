const Attendance = require('../models/Attendance');
const Class      = require('../models/Class');
const Student    = require('../models/Student');

// GET /api/app/attendance?date=YYYY-MM-DD
const getAttendance = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const cls = await Class.findOne({ classTeacher: teacherId, school: schoolId });
    if (!cls) return res.status(403).json({ message: 'You are not a class teacher' });

    const today   = new Date().toISOString().split('T')[0];
    const dateStr = req.query.date || today;

    if (dateStr > today) {
      return res.status(400).json({ message: 'Cannot view attendance for a future date' });
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

    const existing = await Attendance.find({ class: cls._id, date: attendanceDate });
    const recordMap = {};
    existing.forEach(r => { recordMap[r.student.toString()] = r.status; });

    // Include students promoted out but with attendance records for this class/date
    const enrolledSet = new Set(students.map(s => s._id.toString()));
    const historicalIds = [...new Set(
      existing.map(r => r.student.toString()).filter(id => !enrolledSet.has(id))
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
      date:     dateStr,
      isMarked: existing.length > 0,
      records:  students.map(s => ({
        studentId:   s._id,
        name:        s.name,
        rollNumber:  s.rollNumber || null,
        status:      recordMap[s._id.toString()] || 'not-marked',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/app/attendance
// Body: { date: "YYYY-MM-DD", records: [{ studentId, status }] }
const markAttendance = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;
    const { date, records } = req.body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'date and records are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return res.status(400).json({ message: 'Cannot mark attendance for a future date' });
    }
    const dayOfWeek = new Date(date + 'T00:00:00.000Z').getDay();
    if (dayOfWeek === 0) {
      return res.status(400).json({ message: 'Cannot mark attendance on Sunday' });
    }

    const VALID_STATUSES = ['present', 'absent', 'late'];
    const invalid = records.find(r => !VALID_STATUSES.includes(r.status));
    if (invalid) {
      return res.status(400).json({ message: `Invalid status "${invalid.status}". Must be present, absent, or late.` });
    }

    const cls = await Class.findOne({ classTeacher: teacherId, school: schoolId });
    if (!cls) return res.status(403).json({ message: 'You are not a class teacher' });

    const submittedIds = records.map(r => r.studentId);
    const validStudentIds = await Student.find(
      { _id: { $in: submittedIds }, enrolledClass: cls._id, school: schoolId },
    ).distinct('_id');
    const validSet = new Set(validStudentIds.map(id => id.toString()));
    const invalidStudent = submittedIds.find(id => !validSet.has(id?.toString()));
    if (invalidStudent) {
      return res.status(400).json({ message: 'One or more students do not belong to your class' });
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
            status:        status || 'absent',
            markedBy:      teacherId,
            markedByModel: 'Teacher',
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

module.exports = { getAttendance, markAttendance };
