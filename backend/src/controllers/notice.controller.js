const Notice  = require('../models/Notice');
const Student = require('../models/Student');

// POST /api/notices  (admin)
const createNotice = async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'title and content are required' });
    }
    const notice = await Notice.create({
      school:         req.user.school,
      title:          title.trim(),
      content:        content.trim(),
      targetAudience: targetAudience || 'all',
      createdBy:      req.user.id,
    });
    res.status(201).json({ message: 'Notice created', notice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notices  (admin)
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ school: req.user.school, isActive: true })
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notices/:id  (admin)
const updateNotice = async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    if (!title?.trim() && !content?.trim()) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    const update = {};
    if (title?.trim())          update.title          = title.trim();
    if (content?.trim())        update.content        = content.trim();
    if (targetAudience)         update.targetAudience = targetAudience;

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school, isActive: true },
      update,
      { new: true }
    );
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice updated', notice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notices/:id  (admin — soft delete)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      { isActive: false },
      { new: true }
    );
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/app/notices  (teacher)
const getNoticesForTeacher = async (req, res) => {
  try {
    const notices = await Notice.find({
      school:         req.teacher.school,
      isActive:       true,
      targetAudience: { $in: ['all', 'teachers'] },
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/parent/notices  (parent)
const getNoticesForParent = async (req, res) => {
  try {
    const students  = await Student.find({ parentMobile: req.parent.mobile, isDeleted: { $ne: true } }).select('school');
    const schoolIds = [...new Set(students.map(s => s.school.toString()))];
    const notices   = await Notice.find({
      school:         { $in: schoolIds },
      isActive:       true,
      targetAudience: { $in: ['all', 'parents'] },
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice, getNoticesForTeacher, getNoticesForParent };
