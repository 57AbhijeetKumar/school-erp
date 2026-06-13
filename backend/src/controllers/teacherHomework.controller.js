const Homework           = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Class              = require('../models/Class');
const Student            = require('../models/Student');
const { cloudinary, uploadBuffer } = require('../config/cloudinary');
const { stripHtml }      = require('../utils/sanitize');

// GET /api/app/homework
const getHomework = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;

    const cls = await Class.findOne({ classTeacher: teacherId, school: schoolId });

    const query = cls
      ? { school: schoolId, $or: [{ class: cls._id }, { assignedBy: teacherId }] }
      : { school: schoolId, assignedBy: teacherId };

    const list = await Homework.find(query)
      .populate('class',      'name section')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(list.map(h => ({
      id:          h._id,
      title:       h.title,
      description: h.description,
      subject:     h.subject  || null,
      dueDate:     h.dueDate ? h.dueDate.toISOString().split('T')[0] : null,
      class:       { id: h.class._id, name: h.class.name, section: h.class.section || null },
      assignedBy:  { id: h.assignedBy._id, name: h.assignedBy.name },
      isMyHomework: String(h.assignedBy._id) === teacherId,
      attachments: h.attachments || [],
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/app/homework  (multipart/form-data — up to 5 files via multerUpload middleware)
const addHomework = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const schoolId  = req.teacher.school;
    const { title, description, subject, dueDate, classId } = req.body;

    if (!title?.trim() || !description?.trim() || !classId) {
      return res.status(400).json({ message: 'title, description and classId are required' });
    }

    const cls = await Class.findOne({ _id: classId, school: schoolId });
    if (!cls) return res.status(404).json({ message: 'Class not found in your school' });

    // Upload any attached files to Cloudinary
    const attachments = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const isPdf   = file.mimetype === 'application/pdf';
        const result  = await uploadBuffer(file.buffer, {
          folder:        `school-erp/${schoolId}/homework`,
          resource_type: isPdf ? 'raw' : 'image',
        });
        attachments.push({
          url:      result.secure_url,
          publicId: result.public_id,
          type:     isPdf ? 'pdf' : 'image',
          name:     file.originalname,
        });
      }
    }

    const hw = await Homework.create({
      title:       stripHtml(title.trim()),
      description: stripHtml(description.trim()),
      subject:     subject?.trim() || undefined,
      dueDate:     dueDate         || undefined,
      class:       classId,
      school:      schoolId,
      assignedBy:  teacherId,
      attachments,
    });

    res.status(201).json({ message: 'Homework added', id: hw._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/app/homework/:id
// Cascade: delete files from Cloudinary + all HomeworkSubmissions
const deleteHomework = async (req, res) => {
  try {
    const hw = await Homework.findOneAndDelete({
      _id:        req.params.id,
      assignedBy: req.teacher.id,
      school:     req.teacher.school,
    });
    if (!hw) return res.status(404).json({ message: 'Homework not found or you are not authorised to delete it' });

    // Delete attachments from Cloudinary (silently — don't fail the request if Cloudinary is down)
    if (hw.attachments?.length) {
      await Promise.all(hw.attachments.map(a =>
        cloudinary.uploader.destroy(a.publicId, { resource_type: a.type === 'pdf' ? 'raw' : 'image' })
          .catch(() => {})
      ));
    }

    await HomeworkSubmission.deleteMany({ homework: hw._id });
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/classes
const getSchoolClasses = async (req, res) => {
  try {
    const classes = await Class.find({ school: req.teacher.school })
      .select('name section')
      .sort({ name: 1, section: 1 });

    res.json(classes.map(c => ({ id: c._id, name: c.name, section: c.section || null })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/students  — all students in school (for complaint filing)
// Each student includes their enrolled class so the app can group them by class.
const getSchoolStudents = async (req, res) => {
  try {
    const students = await Student.find({ school: req.teacher.school, isDeleted: { $ne: true } })
      .populate('enrolledClass', 'name section')
      .select('name rollNumber enrolledClass')
      .sort({ name: 1 });

    res.json(students.map(s => {
      const cls = s.enrolledClass;
      return {
        id:         s._id,
        name:       s.name,
        rollNumber: s.rollNumber || null,
        classId:    cls?._id    || null,
        className:  cls ? (cls.section ? `${cls.name} — ${cls.section}` : cls.name) : null,
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/app/homework/:id  (teacher — edit own homework)
const updateHomework = async (req, res) => {
  try {
    const hw = await Homework.findOne({
      _id:        req.params.id,
      assignedBy: req.teacher.id,
      school:     req.teacher.school,
    });
    if (!hw) return res.status(404).json({ message: 'Homework not found or you are not authorised to edit it' });

    const { title, description, subject, dueDate } = req.body;
    if (title !== undefined) {
      const t = stripHtml(title?.trim());
      if (!t) return res.status(400).json({ message: 'Title cannot be empty' });
      hw.title = t;
    }
    if (description !== undefined) {
      const d = stripHtml(description?.trim());
      if (!d) return res.status(400).json({ message: 'Description cannot be empty' });
      hw.description = d;
    }
    if (subject !== undefined) hw.subject = subject?.trim() || undefined;
    if (dueDate !== undefined) {
      if (dueDate) {
        const due = new Date(dueDate);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(due)) return res.status(400).json({ message: 'Invalid due date format' });
        if (due < today) return res.status(400).json({ message: 'Due date cannot be in the past' });
        hw.dueDate = due;
      } else {
        hw.dueDate = undefined;
      }
    }
    await hw.save();
    await hw.populate('assignedBy', 'name');
    res.json({ message: 'Homework updated', homework: hw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getHomework, addHomework, deleteHomework, updateHomework, getSchoolClasses, getSchoolStudents };
