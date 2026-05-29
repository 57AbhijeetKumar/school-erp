const StudentLeave = require('../models/StudentLeave');
const Student      = require('../models/Student');
const Class        = require('../models/Class');

const resolverName = (l) => {
  if (l.resolvedByRole === 'teacher') return l.resolvedByTeacher?.name ?? null;
  if (l.resolvedByRole === 'admin')   return l.resolvedByAdmin?.name   ?? null;
  return null;
};

// POST /api/parent/children/:studentId/leave  (parent)
const submitStudentLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !reason?.trim()) {
      return res.status(400).json({ message: 'fromDate, toDate and reason are required' });
    }
    const from    = new Date(fromDate);
    const to      = new Date(toDate);
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

    const student = await Student.findById(req.params.studentId);
    if (!student || student.parentMobile !== req.parent.mobile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leave = await StudentLeave.create({
      school:       student.school,
      student:      student._id,
      class:        student.enrolledClass,
      parentMobile: req.parent.mobile,
      fromDate:     new Date(fromDate),
      toDate:       new Date(toDate),
      reason:       reason.trim(),
    });
    res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/leave  (parent — history)
const getStudentLeaveHistory = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student || student.parentMobile !== req.parent.mobile) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const leaves = await StudentLeave.find({ student: req.params.studentId })
      .populate('resolvedByTeacher', 'name')
      .populate('resolvedByAdmin',   'name')
      .sort({ createdAt: -1 }).limit(30);
    res.json(leaves.map(l => ({
      _id:            l._id,
      fromDate:       l.fromDate,
      toDate:         l.toDate,
      reason:         l.reason,
      status:         l.status,
      rejectionNote:  l.rejectionNote || '',
      resolvedByName: resolverName(l),
      createdAt:      l.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/leave-requests  (teacher — their class only)
const getLeaveRequestsForTeacher = async (req, res) => {
  try {
    const cls = await Class.findOne({ classTeacher: req.teacher.id, school: req.teacher.school });
    if (!cls) return res.status(403).json({ message: 'No class assigned' });

    const leaves = await StudentLeave.find({ class: cls._id, school: req.teacher.school })
      .populate('student', 'name rollNumber')
      .populate('resolvedByTeacher', 'name')
      .populate('resolvedByAdmin',   'name')
      .sort({ createdAt: -1 });
    res.json(leaves.map(l => ({
      _id:            l._id,
      student:        l.student,
      fromDate:       l.fromDate,
      toDate:         l.toDate,
      reason:         l.reason,
      status:         l.status,
      rejectionNote:  l.rejectionNote || '',
      resolvedByName: resolverName(l),
      createdAt:      l.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/app/leave-requests/:id/resolve  (teacher)
const resolveLeaveByTeacher = async (req, res) => {
  try {
    const { action, rejectionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    const cls = await Class.findOne({ classTeacher: req.teacher.id, school: req.teacher.school });
    if (!cls) return res.status(403).json({ message: 'No class assigned' });

    const leave = await StudentLeave.findOne({ _id: req.params.id, class: cls._id });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already resolved' });

    leave.status           = action === 'approve' ? 'approved' : 'rejected';
    leave.resolvedAt       = new Date();
    leave.resolvedByRole   = 'teacher';
    leave.resolvedByTeacher = req.teacher.id;
    leave.rejectionNote    = action === 'reject' ? (rejectionNote || '') : '';
    await leave.save();
    res.json({ message: `Leave ${leave.status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/leave-requests?status=...&classId=...&page=1&limit=20  (admin — all for school)
const getLeaveRequestsForAdmin = async (req, res) => {
  try {
    const { status, classId } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { school: req.user.school };
    if (status)  filter.status = status;
    if (classId) filter.class  = classId;

    const [leaves, total] = await Promise.all([
      StudentLeave.find(filter)
        .populate('student', 'name rollNumber')
        .populate('class',   'name section')
        .populate('resolvedByTeacher', 'name')
        .populate('resolvedByAdmin',   'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      StudentLeave.countDocuments(filter),
    ]);
    res.json({
      data: leaves.map(l => ({
        _id:            l._id,
        student:        l.student,
        class:          l.class,
        fromDate:       l.fromDate,
        toDate:         l.toDate,
        reason:         l.reason,
        status:         l.status,
        rejectionNote:  l.rejectionNote || '',
        resolvedByName: resolverName(l),
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

// PATCH /api/leave-requests/:id/resolve  (admin)
const resolveLeaveByAdmin = async (req, res) => {
  try {
    const { action, rejectionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    const leave = await StudentLeave.findOne({ _id: req.params.id, school: req.user.school });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    leave.status          = action === 'approve' ? 'approved' : 'rejected';
    leave.resolvedAt      = new Date();
    leave.resolvedByRole  = 'admin';
    leave.resolvedByAdmin = req.user.id;
    leave.rejectionNote   = action === 'reject' ? (rejectionNote || '') : '';
    await leave.save();
    res.json({ message: `Leave ${leave.status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/leave-requests/:id  (admin)
const deleteStudentLeave = async (req, res) => {
  try {
    const leave = await StudentLeave.findOne({ _id: req.params.id, school: req.user.school });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    await leave.deleteOne();
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitStudentLeave, getStudentLeaveHistory,
  getLeaveRequestsForTeacher, resolveLeaveByTeacher,
  getLeaveRequestsForAdmin,   resolveLeaveByAdmin,
  deleteStudentLeave,
};
