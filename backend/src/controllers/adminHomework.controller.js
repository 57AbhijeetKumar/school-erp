const Homework = require('../models/Homework');
const Class    = require('../models/Class');

// GET /api/homework/class/:classId  — admin view, read-only
const getClassHomework = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const cls = await Class.findOne({ _id: req.params.classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const list = await Homework.find({ class: cls._id, school: schoolId })
      .populate('assignedBy', 'name subject')
      .sort({ createdAt: -1 });

    res.json(list.map(h => ({
      id:          h._id,
      title:       h.title,
      description: h.description,
      subject:     h.subject || null,
      dueDate:     h.dueDate ? h.dueDate.toISOString().split('T')[0] : null,
      assignedBy:  { id: h.assignedBy._id, name: h.assignedBy.name, subject: h.assignedBy.subject },
      attachments: h.attachments || [],
      createdAt:   h.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/homework/:id  (admin)
const deleteHomework = async (req, res) => {
  try {
    const hw = await Homework.findOne({ _id: req.params.id, school: req.user.school });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    await hw.deleteOne();
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClassHomework, deleteHomework };
