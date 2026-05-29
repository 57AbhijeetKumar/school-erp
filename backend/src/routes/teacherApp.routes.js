const router = require('express').Router();
const multer = require('multer');
const { teacherProtect } = require('../middleware/auth.middleware');
const validateObjectId   = require('../middleware/validateObjectId');
const { getMyClass }     = require('../controllers/teacherApp.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },   // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  },
});

// Wraps multer so its errors return a 400 JSON instead of crashing the request
const multerUpload = (req, res, next) =>
  upload.array('files', 5)(req, res, err =>
    err ? res.status(400).json({ message: err.message }) : next()
  );
const { getAttendance, markAttendance } = require('../controllers/teacherAttendance.controller');
const { getHomework, addHomework, deleteHomework, getSchoolClasses, getSchoolStudents } = require('../controllers/teacherHomework.controller');
const { getMyExams, getExamForMarks, submitMarks, getExamResults }  = require('../controllers/teacherExam.controller');
const { getSubmissions, markSubmissions } = require('../controllers/teacherSubmission.controller');
const { submitTeacherLeave, getMyLeaveRequests } = require('../controllers/teacherLeave.controller');
const { getNoticesForTeacher }                   = require('../controllers/notice.controller');
const { getTimetableForTeacher }                 = require('../controllers/timetable.controller');
const { getLeaveRequestsForTeacher, resolveLeaveByTeacher } = require('../controllers/studentLeave.controller');

router.param('id', validateObjectId);

router.get('/my-class',                    teacherProtect, getMyClass);
router.get('/attendance',                  teacherProtect, getAttendance);
router.post('/attendance',                 teacherProtect, markAttendance);
router.get('/classes',                     teacherProtect, getSchoolClasses);
router.get('/students',                    teacherProtect, getSchoolStudents);
router.get('/homework',                    teacherProtect, getHomework);
router.post('/homework',                   teacherProtect, multerUpload, addHomework);
router.delete('/homework/:id',             teacherProtect, deleteHomework);
router.get('/homework/:id/submissions',    teacherProtect, getSubmissions);
router.post('/homework/:id/submissions',   teacherProtect, markSubmissions);
router.get('/exams',                       teacherProtect, getMyExams);
router.get('/exams/:id/marks',             teacherProtect, getExamForMarks);
router.get('/exams/:id/results',           teacherProtect, getExamResults);
router.post('/exams/:id/marks',            teacherProtect, submitMarks);

router.post('/teacher-leave',              teacherProtect, submitTeacherLeave);
router.get('/teacher-leave',               teacherProtect, getMyLeaveRequests);

router.get('/notices',                     teacherProtect, getNoticesForTeacher);
router.get('/timetable',                   teacherProtect, getTimetableForTeacher);

router.get('/leave-requests',              teacherProtect, getLeaveRequestsForTeacher);
router.patch('/leave-requests/:id/resolve', teacherProtect, resolveLeaveByTeacher);

const { submitComplaintByTeacher, getComplaintsForTeacher, deleteComplaintByTeacher } = require('../controllers/complaint.controller');
router.post('/complaints',       teacherProtect, submitComplaintByTeacher);
router.get('/complaints',        teacherProtect, getComplaintsForTeacher);
router.delete('/complaints/:id', teacherProtect, deleteComplaintByTeacher);

const { getSubjectsForTeacher } = require('../controllers/subject.controller');
router.get('/subjects', teacherProtect, getSubjectsForTeacher);

const { getTodaySubstitutions } = require('../controllers/substitution.controller');
router.get('/substitutions/today', teacherProtect, getTodaySubstitutions);

module.exports = router;
