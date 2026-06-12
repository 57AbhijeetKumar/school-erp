const Notice  = require('../models/Notice');
const Student = require('../models/Student');
const { stripHtml } = require('../utils/sanitize');

// POST /api/notices  (admin)
const createNotice = async (req, res) => {
  try {
    const { title, content, targetAudience, expiryDate } = req.body;
    const cleanTitle   = stripHtml(title?.trim());
    const cleanContent = stripHtml(content?.trim());
    if (!cleanTitle || !cleanContent) {
      return res.status(400).json({ message: 'title and content are required' });
    }
    if (cleanTitle.length > 200)    return res.status(400).json({ message: 'Title cannot exceed 200 characters' });
    if (cleanContent.length > 5000) return res.status(400).json({ message: 'Content cannot exceed 5000 characters' });

    let parsedExpiry = null;
    if (expiryDate) {
      parsedExpiry = new Date(expiryDate);
      if (isNaN(parsedExpiry)) return res.status(400).json({ message: 'Invalid expiry date format' });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (parsedExpiry < today) return res.status(400).json({ message: 'Expiry date cannot be in the past' });
    }

    const notice = await Notice.create({
      school:         req.user.school,
      title:          cleanTitle,
      content:        cleanContent,
      targetAudience: targetAudience || 'all',
      expiryDate:     parsedExpiry,
      createdBy:      req.user.id,
    });
    res.status(201).json({ message: 'Notice created', notice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const notExpiredFilter = () => ({
  $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
});

// GET /api/notices  (admin)
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ school: req.user.school, isActive: true, ...notExpiredFilter() })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notices.map(n => ({
      _id:            n._id,
      title:          n.title,
      content:        n.content,
      targetAudience: n.targetAudience,
      expiryDate:     n.expiryDate ? n.expiryDate.toISOString().split('T')[0] : null,
      createdByName:  n.createdBy?.name || null,
      createdAt:      n.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notices/:id  (admin)
const updateNotice = async (req, res) => {
  try {
    const { title, content, targetAudience, expiryDate } = req.body;
    const cleanTitle   = title   ? stripHtml(title.trim())   : null;
    const cleanContent = content ? stripHtml(content.trim()) : null;
    if (!cleanTitle && !cleanContent && !targetAudience && expiryDate === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    const update = {};
    if (cleanTitle)         update.title          = cleanTitle;
    if (cleanContent)       update.content        = cleanContent;
    if (targetAudience)     update.targetAudience = targetAudience;
    if (expiryDate !== undefined) {
      if (expiryDate === null || expiryDate === '') {
        update.expiryDate = null;
      } else {
        const parsed = new Date(expiryDate);
        if (isNaN(parsed)) return res.status(400).json({ message: 'Invalid expiry date format' });
        update.expiryDate = parsed;
      }
    }

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

// DELETE /api/notices/:id  (admin)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndDelete({ _id: req.params.id, school: req.user.school });
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
      ...notExpiredFilter(),
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
      ...notExpiredFilter(),
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice, getNoticesForTeacher, getNoticesForParent };
