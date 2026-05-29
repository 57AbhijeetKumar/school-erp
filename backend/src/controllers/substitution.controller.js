const Substitution = require('../models/Substitution');

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

module.exports = { getSubstitutionsForLeave, assignSubstitute, getTodaySubstitutions };
