const express = require('express');
const router  = express.Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const {
  getLeaveRequestsForAdmin, resolveLeaveByAdmin, deleteStudentLeave,
} = require('../controllers/studentLeave.controller');

// Admin routes
router.get('/',              protect, adminOnly, schoolScope, getLeaveRequestsForAdmin);
router.patch('/:id/resolve', protect, adminOnly, schoolScope, resolveLeaveByAdmin);
router.delete('/:id',        protect, adminOnly, schoolScope, deleteStudentLeave);

module.exports = router;
