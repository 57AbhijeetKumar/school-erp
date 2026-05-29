const TeacherLeave = require('../models/TeacherLeave');

// POST /api/app/teacher-leave  (teacher)
const submitTeacherLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;
    if (!fromDate || !toDate || !reason?.trim()) {
      return res.status(400).json({ message: 'fromDate, toDate and reason are required' });
    }
    const from     = new Date(fromDate);
    const to       = new Date(toDate);
    const todayUTC = new Date(); todayUTC.setUTCHours(0, 0, 0, 0);
    if (from < todayUTC) {
      return res.status(400).json({ message: 'Leave cannot be requested for a past date' });
    }
    if (from > to) {
      return res.status(400).json({ message: 'fromDate cannot be after toDate' });
    }
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 30) {
      return res.status(400).json({ message: 'Leave request cannot exceed 30 days' });
    }

    const leave = await TeacherLeave.create({
      school:    req.teacher.school,
      teacher:   req.teacher.id,
      fromDate:  new Date(fromDate),
      toDate:    new Date(toDate),
      reason:    reason.trim(),
      leaveType: leaveType || 'casual',
    });
    res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/teacher-leave  (teacher — own history)
const getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await TeacherLeave.find({ teacher: req.teacher.id })
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 }).limit(30);
    res.json(leaves.map(l => ({
      _id:            l._id,
      fromDate:       l.fromDate,
      toDate:         l.toDate,
      reason:         l.reason,
      leaveType:      l.leaveType,
      status:         l.status,
      rejectionNote:  l.rejectionNote || '',
      resolvedByName: l.resolvedBy?.name ?? null,
      createdAt:      l.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teacher-leaves?status=...&page=1&limit=20  (admin)
const getAllTeacherLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { school: req.user.school };
    if (status) filter.status = status;

    const [leaves, total] = await Promise.all([
      TeacherLeave.find(filter)
        .populate('teacher',    'name email')
        .populate('resolvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      TeacherLeave.countDocuments(filter),
    ]);
    res.json({
      data: leaves.map(l => ({
        _id:            l._id,
        teacher:        l.teacher,
        fromDate:       l.fromDate,
        toDate:         l.toDate,
        reason:         l.reason,
        leaveType:      l.leaveType,
        status:         l.status,
        rejectionNote:  l.rejectionNote || '',
        resolvedByName: l.resolvedBy?.name ?? null,
        createdAt:      l.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/teacher-leaves/:id/resolve  (admin)
const resolveTeacherLeave = async (req, res) => {
  try {
    const { action, rejectionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const leave = await TeacherLeave.findOne({ _id: req.params.id, school: req.user.school });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already resolved' });

    leave.status        = action === 'approve' ? 'approved' : 'rejected';
    leave.resolvedAt    = new Date();
    leave.resolvedBy    = req.user.id;
    leave.rejectionNote = action === 'reject' ? (rejectionNote || '') : '';
    await leave.save();
    res.json({ message: `Leave ${leave.status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teacher-leaves/:id  (admin)
const deleteTeacherLeave = async (req, res) => {
  try {
    const leave = await TeacherLeave.findOne({ _id: req.params.id, school: req.user.school });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    await leave.deleteOne();
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitTeacherLeave, getMyLeaveRequests, getAllTeacherLeaves, resolveTeacherLeave, deleteTeacherLeave };
