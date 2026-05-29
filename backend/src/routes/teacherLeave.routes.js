const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getAllTeacherLeaves, resolveTeacherLeave, deleteTeacherLeave,
} = require('../controllers/teacherLeave.controller');

// Admin routes
router.get('/',              protect, adminOnly, getAllTeacherLeaves);
router.patch('/:id/resolve', protect, adminOnly, resolveTeacherLeave);
router.delete('/:id',        protect, adminOnly, deleteTeacherLeave);

module.exports = router;
