const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Class              = require('../models/Class');
const { stripHtml }      = require('../utils/sanitize');

// GET /api/homework/class/:classId  — admin view, read-only
const getClassHomework = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const cls = await Class.findOne({ _id: req.params.classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const list = await Homework.find({ class: cls._id, school: schoolId })
      .populate('assignedBy', 'name subject')
      .sort({ createdAt: -1 });

    const className = cls.section ? `${cls.name} — ${cls.section}` : cls.name;
    res.json(list.map(h => ({
      id:          h._id,
      title:       h.title,
      description: h.description,
      subject:     h.subject || null,
      dueDate:     h.dueDate ? h.dueDate.toISOString().split('T')[0] : null,
      className,
      assignedBy:  { id: h.assignedBy._id, name: h.assignedBy.name, subject: h.assignedBy.subject },
      attachments: h.attachments || [],
      createdAt:   h.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/homework  (admin) — attributed to the class teacher
const createHomework = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { classId, title, description, subject, dueDate } = req.body;

    if (!classId)              return res.status(400).json({ message: 'classId is required' });
    if (!title?.trim())        return res.status(400).json({ message: 'title is required' });
    if (!description?.trim())  return res.status(400).json({ message: 'description is required' });

    if (dueDate) {
      const due   = new Date(dueDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (isNaN(due)) return res.status(400).json({ message: 'Invalid due date format' });
      if (due < today) return res.status(400).json({ message: 'Due date cannot be in the past' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!cls.classTeacher) {
      return res.status(400).json({ message: 'No class teacher assigned — assign a class teacher before creating homework' });
    }

    const hw = await Homework.create({
      title:       stripHtml(title.trim()),
      description: stripHtml(description.trim()),
      subject:     stripHtml(subject?.trim()) || undefined,
      dueDate:     dueDate || undefined,
      class:       classId,
      school:      schoolId,
      assignedBy:  cls.classTeacher,
    });

    await hw.populate('assignedBy', 'name subject');

    const className = cls.section ? `${cls.name} — ${cls.section}` : cls.name;
    res.status(201).json({
      id:          hw._id,
      title:       hw.title,
      description: hw.description,
      subject:     hw.subject || null,
      dueDate:     hw.dueDate ? hw.dueDate.toISOString().split('T')[0] : null,
      className,
      assignedBy:  { id: hw.assignedBy._id, name: hw.assignedBy.name, subject: hw.assignedBy.subject },
      attachments: [],
      createdAt:   hw.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/homework/:id  (admin)
const updateHomework = async (req, res) => {
  try {
    const hw = await Homework.findOne({ _id: req.params.id, school: req.user.school });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    const { title, description, subject, dueDate } = req.body;

    if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
      const due   = new Date(dueDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (isNaN(due)) return res.status(400).json({ message: 'Invalid due date format' });
      if (due < today) return res.status(400).json({ message: 'Due date cannot be in the past' });
      hw.dueDate = due;
    } else if (dueDate === null || dueDate === '') {
      hw.dueDate = undefined;
    }

    if (title !== undefined) {
      const clean = stripHtml(title.trim());
      if (!clean) return res.status(400).json({ message: 'title cannot be empty' });
      hw.title = clean;
    }
    if (description !== undefined) {
      const clean = stripHtml(description.trim());
      if (!clean) return res.status(400).json({ message: 'description cannot be empty' });
      hw.description = clean;
    }
    if (subject !== undefined) {
      hw.subject = subject?.trim() ? stripHtml(subject.trim()) : undefined;
    }

    await hw.save();
    await hw.populate('assignedBy', 'name subject');

    const cls = await Class.findById(hw.class).select('name section');
    const className = cls ? (cls.section ? `${cls.name} — ${cls.section}` : cls.name) : '';

    res.json({
      id:          hw._id,
      title:       hw.title,
      description: hw.description,
      subject:     hw.subject || null,
      dueDate:     hw.dueDate ? hw.dueDate.toISOString().split('T')[0] : null,
      className,
      assignedBy:  { id: hw.assignedBy._id, name: hw.assignedBy.name, subject: hw.assignedBy.subject },
      attachments: hw.attachments || [],
      createdAt:   hw.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/homework/:id  (admin)
const deleteHomework = async (req, res) => {
  try {
    const hw = await Homework.findOne({ _id: req.params.id, school: req.user.school });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    await HomeworkSubmission.deleteMany({ homework: hw._id });
    await hw.deleteOne();
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClassHomework, createHomework, updateHomework, deleteHomework };
