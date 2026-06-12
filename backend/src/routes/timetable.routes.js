const express = require('express');
const router  = express.Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const {
  setTimetable,
  checkConflicts,
  getTimetable,
  getAllTimetables,
  deleteTimetable,
} = require('../controllers/timetable.controller');

router.post('/',                 protect, adminOnly, schoolScope, setTimetable);
router.post('/check-conflicts',  protect, adminOnly, schoolScope, checkConflicts);
router.get('/all',               protect, adminOnly, schoolScope, getAllTimetables);
router.get('/',                  protect, adminOnly, schoolScope, getTimetable);
router.delete('/:classId',       protect, adminOnly, schoolScope, deleteTimetable);

module.exports = router;
