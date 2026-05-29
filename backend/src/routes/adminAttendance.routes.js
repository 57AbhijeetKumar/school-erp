const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const { getClassAttendance, getAttendanceDates, markClassAttendance } = require('../controllers/adminAttendance.controller');

// All routes: admin-only, scoped to school
router.get('/class/:classId',        protect, adminOnly, schoolScope, getClassAttendance);
router.get('/class/:classId/dates',  protect, adminOnly, schoolScope, getAttendanceDates);
router.post('/class/:classId',       protect, adminOnly, schoolScope, markClassAttendance);

module.exports = router;
