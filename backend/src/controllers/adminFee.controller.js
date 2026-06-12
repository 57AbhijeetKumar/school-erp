const Fee     = require('../models/Fee');
const Student = require('../models/Student');
const Class   = require('../models/Class');

// GET /api/fees?classId=...&month=YYYY-MM
const getClassFees = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId, month } = req.query;

    if (!classId || !month) {
      return res.status(400).json({ message: 'classId and month are required' });
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format (e.g. 2026-06)' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student
      .find({ enrolledClass: classId, school: schoolId, isDeleted: { $ne: true } })
      .sort({ rollNumber: 1, name: 1 })
      .select('name rollNumber');

    const records = await Fee.find({ class: classId, school: schoolId, month })
      .populate('markedBy', 'name');
    const feeMap  = {};
    records.forEach(r => { feeMap[r.student.toString()] = r; });

    // Include students promoted out but who have fee records for this class/month
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

    const list = students.map(s => {
      const fee = feeMap[s._id.toString()];
      return {
        studentId:  s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        status:      fee?.status          || 'due',
        amount:      fee?.amount          ?? 0,
        paidAt:      fee?.paidAt          || null,
        note:        fee?.note            || null,
        markedByName: fee?.markedBy?.name || null,
      };
    });

    const paid    = list.filter(r => r.status === 'paid').length;
    const partial = list.filter(r => r.status === 'partial').length;
    const due     = list.filter(r => r.status === 'due').length;
    res.json({
      classId,
      className: cls.section ? `${cls.name} - ${cls.section}` : cls.name,
      month,
      summary:   { total: list.length, paid, partial, due },
      students:  list,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/mark
// Body: { studentId, month, status, amount, note }
const markFee = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { studentId, month, status, amount, note } = req.body;

    if (!studentId || !month || !status) {
      return res.status(400).json({ message: 'studentId, month and status are required' });
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format (e.g. 2026-06)' });
    }
    if (!['paid', 'partial', 'due'].includes(status)) {
      return res.status(400).json({ message: 'status must be "paid", "partial", or "due"' });
    }
    if (amount !== undefined && Number(amount) < 0) {
      return res.status(400).json({ message: 'amount cannot be negative' });
    }
    if (status === 'partial' && (!amount || Number(amount) <= 0)) {
      return res.status(400).json({ message: 'amount is required and must be > 0 for partial payment' });
    }

    const student = await Student.findOne({ _id: studentId, school: schoolId, isDeleted: { $ne: true } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Warn if already paid (full payment) — allow update but surface the flag
    const existing = await Fee.findOne({ student: studentId, month });
    const wasAlreadyPaid = existing?.status === 'paid';

    const update = {
      student:  studentId,
      class:    student.enrolledClass,
      school:   schoolId,
      month,
      status,
      amount:   amount   ?? 0,
      note:     note?.trim() || undefined,
      markedBy: req.user.id,
      paidAt:   status === 'paid' ? (existing?.paidAt || new Date()) : (status === 'partial' ? new Date() : null),
    };

    const fee = await Fee.findOneAndUpdate(
      { student: studentId, month },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({
      message: `Fee marked as ${status}`,
      wasAlreadyPaid,
      fee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/mark-bulk
// Body: { classId, month, status, amount } — marks all students of a class
const markBulkFee = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId, month, status, amount } = req.body;

    if (!classId || !month || !status) {
      return res.status(400).json({ message: 'classId, month and status are required' });
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format (e.g. 2026-06)' });
    }
    if (!['paid', 'partial', 'due'].includes(status)) {
      return res.status(400).json({ message: 'status must be "paid", "partial", or "due"' });
    }
    if (amount !== undefined && Number(amount) < 0) {
      return res.status(400).json({ message: 'amount cannot be negative' });
    }
    if (status === 'partial' && (!amount || Number(amount) <= 0)) {
      return res.status(400).json({ message: 'amount is required and must be > 0 for partial payment' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await Student
      .find({ enrolledClass: classId, school: schoolId })
      .select('_id');

    const ops = students.map(s => ({
      updateOne: {
        filter: { student: s._id, month },
        update: {
          $set: {
            student:  s._id,
            class:    classId,
            school:   schoolId,
            month,
            status,
            amount:   amount ?? 0,
            markedBy: req.user.id,
            paidAt:   status === 'paid' ? new Date() : null,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) await Fee.bulkWrite(ops);

    res.json({ message: `${ops.length} student fee(s) marked as ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClassFees, markFee, markBulkFee };
