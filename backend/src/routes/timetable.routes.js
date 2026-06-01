const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { setTimetable, getTimetable, getAllTimetables, deleteTimetable } = require('../controllers/timetable.controller');

router.post('/',              protect, adminOnly, setTimetable);
router.get('/all',            protect, adminOnly, getAllTimetables);
router.get('/',               protect, adminOnly, getTimetable);
router.delete('/:classId',    protect, adminOnly, deleteTimetable);

module.exports = router;
