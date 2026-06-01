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

    // Validate times only when both are provided
    const timeRe = /^\d{2}:\d{2}$/;
    for (const day of schedule) {
      for (const period of (day.periods || [])) {
        const hasStart = period.startTime?.trim();
        const hasEnd   = period.endTime?.trim();
        if (hasStart || hasEnd) {
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
    }

    const cls = await Class.findOne({ _id: classId, school: req.user.school });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // ── Teacher conflict check ────────────────────────────────────────────────
    // Collect every (day, periodNumber, teacherName) that has a real teacher assigned
    const incoming = [];
    for (const day of schedule) {
      for (const period of (day.periods || [])) {
        if (period.teacherName?.trim() && period.subject?.trim()) {
          incoming.push({
            day:          day.day,
            periodNumber: period.periodNumber,
            teacherName:  period.teacherName.trim(),
          });
        }
      }
    }

    if (incoming.length > 0) {
      // Load all OTHER classes' timetables and scan for same day+period+teacher
      const otherTimetables = await Timetable.find({
        school: req.user.school,
        class:  { $ne: classId },
      }).populate('class', 'name section');

      const conflicts = [];
      for (const tt of otherTimetables) {
        if (!tt.class) continue;
        const conflictClass = tt.class.section
          ? `${tt.class.name} — ${tt.class.section}`
          : tt.class.name;
        for (const day of tt.schedule) {
          for (const period of (day.periods || [])) {
            if (!period.teacherName?.trim()) continue;
            const match = incoming.find(
              i => i.day         === day.day &&
                   i.periodNumber === period.periodNumber &&
                   i.teacherName  === period.teacherName.trim()
            );
            if (match) {
              conflicts.push({
                teacherName:   match.teacherName,
                day:           match.day,
                periodNumber:  match.periodNumber,
                conflictClass,
              });
            }
          }
        }
      }

      if (conflicts.length > 0) {
        const f = conflicts[0];
        return res.status(409).json({
          message: `${f.teacherName} is already assigned to ${f.conflictClass} on ${f.day} Period ${f.periodNumber}`,
          conflicts,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
// Always returns both:
//   classTimetable — full class schedule if this teacher is the class teacher (null otherwise)
//   mySchedule     — only the periods across all classes where this teacher's name appears
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getTimetableForTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select('name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // ── 1. Class timetable (only if this teacher is assigned as class teacher) ──
    const myClass = await Class.findOne({ classTeacher: req.teacher.id, school: req.teacher.school })
      .select('name section');

    let classTimetable = null;
    if (myClass) {
      const tt = await Timetable.findOne({ school: req.teacher.school, class: myClass._id });
      classTimetable = {
        className: myClass.section ? `${myClass.name} — ${myClass.section}` : myClass.name,
        schedule:  tt?.schedule ?? [],
      };
    }

    // ── 2. Personal schedule — periods assigned to this teacher across all classes ──
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

    const mySchedule = Object.entries(dayMap)
      .map(([day, periods]) => ({ day, periods: periods.sort((a, b) => a.periodNumber - b.periodNumber) }))
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

    res.json({ classTimetable, mySchedule });
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

// GET /api/timetable/all  (admin — all classes, used for real-time conflict detection)
const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({ school: req.user.school })
      .populate('class', 'name section');
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { setTimetable, getTimetable, getAllTimetables, getTimetableForTeacher, getTimetableForStudent, deleteTimetable };
