const Substitution = require('../models/Substitution');
const TeacherLeave = require('../models/TeacherLeave');
const Teacher      = require('../models/Teacher');
const Timetable    = require('../models/Timetable');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/substitutions?leaveId=...  (admin)
const getSubstitutionsForLeave = async (req, res) => {
  try {
    const { leaveId } = req.query;
    if (!leaveId) return res.status(400).json({ message: 'leaveId is required' });

    const subs = await Substitution.find({ school: req.user.school, leaveId })
      .sort({ date: 1, periodNumber: 1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/substitutions/:id  (admin — assign a substitute teacher)
const assignSubstitute = async (req, res) => {
  try {
    const { substituteTeacherId, substituteTeacherName } = req.body;
    if (!substituteTeacherId || !substituteTeacherName?.trim()) {
      return res.status(400).json({ message: 'substituteTeacherId and substituteTeacherName are required' });
    }

    const sub = await Substitution.findOne({ _id: req.params.id, school: req.user.school });
    if (!sub) return res.status(404).json({ message: 'Substitution record not found' });

    sub.substituteTeacherId   = substituteTeacherId;
    sub.substituteTeacherName = substituteTeacherName.trim();
    sub.status = 'assigned';
    await sub.save();

    res.json({ message: 'Substitute assigned', substitution: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/substitutions/today  (teacher — own extra duties for today)
const getTodaySubstitutions = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const subs = await Substitution.find({
      school:              req.teacher.school,
      substituteTeacherId: req.teacher.id,
      date:                { $gte: todayStart, $lte: todayEnd },
    }).sort({ periodNumber: 1 });

    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/substitutions/generate  (admin — retroactively generate for an approved leave)
const generateSubstitutions = async (req, res) => {
  try {
    const { leaveId } = req.body;
    if (!leaveId) return res.status(400).json({ message: 'leaveId is required' });

    const leave = await TeacherLeave.findOne({ _id: leaveId, school: req.user.school });
    if (!leave)              return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'approved') return res.status(400).json({ message: 'Leave is not approved' });

    const teacher = await Teacher.findById(leave.teacher).select('name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // Wipe existing records for this leave to avoid duplicates
    await Substitution.deleteMany({ leaveId: leave._id });

    const allTimetables = await Timetable.find({ school: leave.school })
      .populate('class', 'name section');

    const substitutions = [];
    const current = new Date(leave.fromDate);
    current.setUTCHours(0, 0, 0, 0);
    const to = new Date(leave.toDate);
    to.setUTCHours(23, 59, 59, 999);

    while (current <= to) {
      const dayName = DAY_NAMES[current.getUTCDay()];

      for (const tt of allTimetables) {
        const cls = tt.class;
        if (!cls) continue;
        const className = cls.section ? `${cls.name} — ${cls.section}` : cls.name;
        const daySchedule = tt.schedule.find(d => d.day === dayName);
        if (!daySchedule) continue;

        for (const period of daySchedule.periods) {
          if (period.teacherName === teacher.name && period.subject?.trim()) {
            substitutions.push({
              school:            leave.school,
              leaveId:           leave._id,
              date:              new Date(current),
              dayName,
              classId:           cls._id,
              className,
              periodNumber:      period.periodNumber,
              subject:           period.subject,
              startTime:         period.startTime || '',
              endTime:           period.endTime   || '',
              absentTeacherId:   leave.teacher,
              absentTeacherName: teacher.name,
            });
          }
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (substitutions.length > 0) {
      await Substitution.insertMany(substitutions);
    }

    const created = await Substitution.find({ leaveId: leave._id }).sort({ date: 1, periodNumber: 1 });
    res.json({ message: `Generated ${created.length} substitution record(s)`, substitutions: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSubstitutionsForLeave, assignSubstitute, getTodaySubstitutions, generateSubstitutions };
