const router = require('express').Router();
const { parentProtect } = require('../middleware/auth.middleware');
const validateObjectId  = require('../middleware/validateObjectId');
const { parentLogin }   = require('../controllers/parentAuth.controller');
const {
  getChildren,
  getChildAttendance,
  getChildHomework,
  getChildExams,
  getChildFees,
} = require('../controllers/parentApp.controller');
const { submitStudentLeave, getStudentLeaveHistory } = require('../controllers/studentLeave.controller');
const { getNoticesForParent }                        = require('../controllers/notice.controller');
const { getTimetableForStudent }                     = require('../controllers/timetable.controller');

router.param('studentId', validateObjectId);
router.param('id',        validateObjectId);

router.post('/login', parentLogin);

router.get('/children',                              parentProtect, getChildren);
router.get('/children/:studentId/attendance',        parentProtect, getChildAttendance);
router.get('/children/:studentId/homework',          parentProtect, getChildHomework);
router.get('/children/:studentId/exams',             parentProtect, getChildExams);
router.get('/children/:studentId/fees',              parentProtect, getChildFees);
router.post('/children/:studentId/leave',            parentProtect, submitStudentLeave);
router.get('/children/:studentId/leave',             parentProtect, getStudentLeaveHistory);
router.get('/children/:studentId/timetable',         parentProtect, getTimetableForStudent);
router.get('/notices',                               parentProtect, getNoticesForParent);

const { submitComplaintByParent, getComplaintsForParent, deleteComplaintByParent } = require('../controllers/complaint.controller');
router.post('/children/:studentId/complaints', parentProtect, submitComplaintByParent);
router.get('/children/:studentId/complaints',  parentProtect, getComplaintsForParent);
router.delete('/complaints/:id',               parentProtect, deleteComplaintByParent);

module.exports = router;
