const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  setTimetable,
  checkConflicts,
  getTimetable,
  getAllTimetables,
  deleteTimetable,
} = require('../controllers/timetable.controller');

router.post('/',                 protect, adminOnly, setTimetable);
router.post('/check-conflicts',  protect, adminOnly, checkConflicts);
router.get('/all',               protect, adminOnly, getAllTimetables);
router.get('/',                  protect, adminOnly, getTimetable);
router.delete('/:classId',       protect, adminOnly, deleteTimetable);

module.exports = router;
