const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getLeaveRequestsForAdmin, resolveLeaveByAdmin, deleteStudentLeave,
} = require('../controllers/studentLeave.controller');

// Admin routes
router.get('/',              protect, adminOnly, getLeaveRequestsForAdmin);
router.patch('/:id/resolve', protect, adminOnly, resolveLeaveByAdmin);
router.delete('/:id',        protect, adminOnly, deleteStudentLeave);

module.exports = router;
