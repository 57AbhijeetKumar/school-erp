const Timetable = require('../models/Timetable');
const Class     = require('../models/Class');
const Student   = require('../models/Student');
const Teacher   = require('../models/Teacher');

// POST /api/timetable  (admin — upsert)
const setTimetable = async (req, res) => {
  try {
    const { classId, schedule } = req.body;
    if (!classId || !Array.isArray(schedule)) {
      return res.status(400).json({ message: 'classId and schedule are required' });
    }

    // Validate that each period's endTime is after startTime
    const timeRe = /^\d{2}:\d{2}$/;
    for (const day of schedule) {
      for (const period of (day.periods || [])) {
        if (!timeRe.test(period.startTime) || !timeRe.test(period.endTime)) {
          return res.status(400).json({ message: `Period ${period.periodNumber} on ${day.day}: time must be HH:MM` });
        }
        if (period.startTime >= period.endTime) {
          return res.status(400).json({
            message: `Period ${period.periodNumber} on ${day.day}: end time must be after start time`,
          });
        }
      }
    }

    const cls = await Class.findOne({ _id: classId, school: req.user.school });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const timetable = await Timetable.findOneAndUpdate(
      { school: req.user.school, class: classId },
      { school: req.user.school, class: classId, schedule },
      { upsert: true, new: true }
    );
    res.json({ message: 'Timetable saved', timetable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/timetable?classId=...  (admin)
const getTimetable = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'classId is required' });
    const timetable = await Timetable.findOne({ school: req.user.school, class: classId });
    res.json(timetable || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/timetable  (teacher)
// Class teacher → returns their class full timetable (type: "class")
// Subject teacher → returns periods across all classes where their name appears (type: "personal")
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getTimetableForTeacher = async (req, res) => {
  try {
    const cls = await Class.findOne({ classTeacher: req.teacher.id, school: req.teacher.school })
      .select('name section');

    if (cls) {
      const timetable = await Timetable.findOne({ school: req.teacher.school, class: cls._id });
      const className = cls.section ? `${cls.name} — ${cls.section}` : cls.name;
      return res.json({
        type:      'class',
        _id:       timetable?._id ?? null,
        className,
        schedule:  timetable?.schedule ?? [],
      });
    }

    // Subject teacher: scan all school timetables for periods assigned to this teacher
    const teacher      = await Teacher.findById(req.teacher.id).select('name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const allTimetables = await Timetable.find({ school: req.teacher.school })
      .populate('class', 'name section');

    const dayMap = {};
    for (const tt of allTimetables) {
      const cls = tt.class;
      if (!cls) continue;
      const className = cls.section ? `${cls.name} — ${cls.section}` : cls.name;
      for (const daySchedule of tt.schedule) {
        for (const period of daySchedule.periods) {
          if (period.teacherName === teacher.name && period.subject?.trim()) {
            if (!dayMap[daySchedule.day]) dayMap[daySchedule.day] = [];
            dayMap[daySchedule.day].push({
              periodNumber: period.periodNumber,
              subject:      period.subject,
              teacherName:  teacher.name,
              startTime:    period.startTime,
              endTime:      period.endTime,
              className,
            });
          }
        }
      }
    }

    const schedule = Object.entries(dayMap)
      .map(([day, periods]) => ({ day, periods: periods.sort((a, b) => a.periodNumber - b.periodNumber) }))
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

    res.json({ type: 'personal', schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/timetable  (parent)
const getTimetableForStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student || student.parentMobile !== req.parent.mobile) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const timetable = await Timetable.findOne({ school: student.school, class: student.enrolledClass });
    res.json(timetable || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/timetable/:classId  (admin — reset timetable)
const deleteTimetable = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.classId, school: req.user.school });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    await Timetable.findOneAndDelete({ class: req.params.classId, school: req.user.school });
    res.json({ message: 'Timetable cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { setTimetable, getTimetable, getTimetableForTeacher, getTimetableForStudent, deleteTimetable };
