const Complaint = require('../models/Complaint');
const Student   = require('../models/Student');
const Class     = require('../models/Class');
const Teacher   = require('../models/Teacher');

const WITHIN_24H = (c) => Date.now() - new Date(c.createdAt).getTime() < 24 * 60 * 60 * 1000;

// Helper: shape a complaint doc into a response object with a canDelete flag
// callerRole: 'teacher'|'admin'|'parent', callerId: teacher id / admin id / parent mobile
function shape(c, callerRole, callerId) {
  const isOwn = callerRole === 'teacher'
    ? c.raisedByRole === 'teacher' && c.raisedByTeacher?.toString() === callerId
    : callerRole === 'parent'
    ? c.raisedByRole === 'parent' && c.raisedByParentMobile === callerId
    : true; // admin always owns

  const canDelete = callerRole === 'admin'
    ? true
    : isOwn && c.status === 'open' && WITHIN_24H(c);

  return {
    _id:          c._id,
    raisedByRole: c.raisedByRole,
    raisedByName: c.raisedByName,
    student:      c.student,
    class:        c.class ? { id: c.class._id, name: c.class.name, section: c.class.section || null } : null,
    category:     c.category,
    severity:     c.severity,
    title:        c.title,
    description:  c.description,
    status:       c.status,
    resolvedNote: c.resolvedNote || '',
    resolvedByName: c.resolvedBy?.name ?? null,
    isOwn,
    canDelete,
    createdAt:    c.createdAt,
  };
}

// ── TEACHER ───────────────────────────────────────────────────────────────────

// POST /api/app/complaints
const submitComplaintByTeacher = async (req, res) => {
  try {
    const { studentId, category, severity, title, description } = req.body;
    if (!studentId || !category || !severity || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'studentId, category, severity, title and description are required' });
    }

    // Any teacher can file a complaint about any student in their school
    const student = await Student.findOne({ _id: studentId, school: req.teacher.school, isDeleted: { $ne: true } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Look up teacher name if not in JWT
    let teacherName = req.teacher.name;
    if (!teacherName) {
      const t = await Teacher.findById(req.teacher.id).select('name');
      teacherName = t?.name ?? 'Teacher';
    }

    const complaint = await Complaint.create({
      school:          req.teacher.school,
      raisedByRole:    'teacher',
      raisedByTeacher: req.teacher.id,
      raisedByName:    teacherName,
      student:         student._id,
      class:           student.enrolledClass,
      category,
      severity,
      title:       title.trim(),
      description: description.trim(),
    });

    res.status(201).json({ message: 'Complaint raised', complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/complaints
const getComplaintsForTeacher = async (req, res) => {
  try {
    const cls = await Class.findOne({ classTeacher: req.teacher.id, school: req.teacher.school });

    const myComplaintsQuery = Complaint.find({ school: req.teacher.school, raisedByTeacher: req.teacher.id })
      .populate('student', 'name rollNumber')
      .populate('class',   'name section')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    if (cls) {
      const [mine, classOnes] = await Promise.all([
        myComplaintsQuery,
        Complaint.find({ school: req.teacher.school, class: cls._id })
          .populate('student', 'name rollNumber')
          .populate('class',   'name section')
          .populate('resolvedBy', 'name')
          .sort({ createdAt: -1 }),
      ]);
      const myIds = new Set(mine.map(c => c._id.toString()));
      return res.json({
        myComplaints:    mine.map(c => shape(c, 'teacher', req.teacher.id)),
        classComplaints: classOnes.filter(c => !myIds.has(c._id.toString()))
                                  .map(c => shape(c, 'teacher', req.teacher.id)),
      });
    }

    const mine = await myComplaintsQuery;
    res.json({
      myComplaints:    mine.map(c => shape(c, 'teacher', req.teacher.id)),
      classComplaints: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/app/complaints/:id
const deleteComplaintByTeacher = async (req, res) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, school: req.teacher.school, raisedByTeacher: req.teacher.id });
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (c.status !== 'open') return res.status(400).json({ message: 'Only open complaints can be deleted' });
    if (!WITHIN_24H(c))      return res.status(400).json({ message: 'Delete window (24 h) has passed' });
    await c.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/complaints
const getComplaintsForAdmin = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) return res.status(403).json({ message: 'No school associated with this account' });

    const { status, severity, raisedByRole, classId } = req.query;

    const VALID_STATUS = ['open', 'acknowledged', 'resolved'];
    const VALID_SEVERITY = ['low', 'medium', 'high'];
    const VALID_ROLE = ['teacher', 'parent'];

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUS.join(', ')}` });
    }
    if (severity && !VALID_SEVERITY.includes(severity)) {
      return res.status(400).json({ message: `severity must be one of: ${VALID_SEVERITY.join(', ')}` });
    }
    if (raisedByRole && !VALID_ROLE.includes(raisedByRole)) {
      return res.status(400).json({ message: `raisedByRole must be one of: ${VALID_ROLE.join(', ')}` });
    }

    const filter = { school: schoolId };
    if (status)       filter.status       = status;
    if (severity)     filter.severity     = severity;
    if (raisedByRole) filter.raisedByRole = raisedByRole;
    if (classId)      filter.class        = classId;

    const complaints = await Complaint.find(filter)
      .populate('student', 'name rollNumber')
      .populate('class',   'name section')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints.map(c => shape(c, 'admin', req.user.id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/complaints/:id/acknowledge
const acknowledgeComplaint = async (req, res) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, school: req.user.school });
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (c.status !== 'open') return res.status(400).json({ message: 'Only open complaints can be acknowledged' });
    c.status = 'acknowledged';
    await c.save();
    res.json({ message: 'Complaint acknowledged' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/complaints/:id/resolve
const resolveComplaint = async (req, res) => {
  try {
    const { resolvedNote } = req.body;
    const c = await Complaint.findOne({ _id: req.params.id, school: req.user.school });
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (c.status === 'resolved') return res.status(400).json({ message: 'Already resolved' });
    c.status       = 'resolved';
    c.resolvedAt   = new Date();
    c.resolvedBy   = req.user.id;
    c.resolvedNote = resolvedNote?.trim() || '';
    await c.save();
    res.json({ message: 'Complaint resolved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/complaints/:id
const deleteComplaintByAdmin = async (req, res) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, school: req.user.school });
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    await c.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PARENT ────────────────────────────────────────────────────────────────────

// POST /api/parent/children/:studentId/complaints
const submitComplaintByParent = async (req, res) => {
  try {
    const { category, severity, title, description } = req.body;
    if (!category || !severity || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'category, severity, title and description are required' });
    }
    if (!['home_concern','other'].includes(category)) {
      return res.status(400).json({ message: 'Parents can only raise home_concern or other complaints' });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student || student.parentMobile !== req.parent.mobile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const parentName = student.parentName || `Parent (${req.parent.mobile})`;

    const complaint = await Complaint.create({
      school:               student.school,
      raisedByRole:         'parent',
      raisedByParentMobile: req.parent.mobile,
      raisedByName:         parentName,
      student:              student._id,
      class:                student.enrolledClass,
      category,
      severity,
      title:       title.trim(),
      description: description.trim(),
    });

    res.status(201).json({ message: 'Complaint raised', complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/children/:studentId/complaints
const getComplaintsForParent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student || student.parentMobile !== req.parent.mobile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaints = await Complaint.find({ student: req.params.studentId })
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints.map(c => shape(c, 'parent', req.parent.mobile)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/parent/complaints/:id
const deleteComplaintByParent = async (req, res) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, raisedByParentMobile: req.parent.mobile });
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (c.status !== 'open') return res.status(400).json({ message: 'Only open complaints can be deleted' });
    if (!WITHIN_24H(c))      return res.status(400).json({ message: 'Delete window (24 h) has passed' });
    await c.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitComplaintByTeacher, getComplaintsForTeacher, deleteComplaintByTeacher,
  getComplaintsForAdmin, acknowledgeComplaint, resolveComplaint, deleteComplaintByAdmin,
  submitComplaintByParent, getComplaintsForParent, deleteComplaintByParent,
};
