const Subject = require('../models/Subject');

// ── Admin: list all subjects for this school ──────────────────────────────────
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ school: req.user.school, isActive: true })
      .select('name code')
      .sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: create a subject ───────────────────────────────────────────────────
const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Subject name is required' });
    if (name.trim().length > 100) return res.status(400).json({ message: 'Subject name cannot exceed 100 characters' });
    if (code?.trim().length > 20) return res.status(400).json({ message: 'Subject code cannot exceed 20 characters' });

    const exists = await Subject.findOne({ school: req.user.school, name: new RegExp(`^${name.trim()}$`, 'i') });
    if (exists) return res.status(409).json({ message: `Subject "${name.trim()}" already exists` });

    const subject = await Subject.create({
      name:   name.trim(),
      code:   code?.trim() || undefined,
      school: req.user.school,
    });

    res.status(201).json({ _id: subject._id, name: subject.name, code: subject.code || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: update a subject name / code ───────────────────────────────────────
const updateSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Subject name is required' });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      { name: name.trim(), code: code?.trim() || undefined },
      { new: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    res.json({ _id: subject._id, name: subject.name, code: subject.code || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: delete a subject ───────────────────────────────────────────────────
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, school: req.user.school });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: `Subject "${subject.name}" deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Teacher app: list all active subjects (read-only) ────────────────────────
const getSubjectsForTeacher = async (req, res) => {
  try {
    const subjects = await Subject.find({ school: req.teacher.school, isActive: true })
      .select('name code')
      .sort({ name: 1 });
    res.json(subjects.map(s => ({ id: s._id, name: s.name, code: s.code || null })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject, getSubjectsForTeacher };
