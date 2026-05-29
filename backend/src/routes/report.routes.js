const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const {
  studentRoster,
  attendanceReport,
  examsList,
  examResultsReport,
  feeReport,
  reportCard,
} = require('../controllers/report.controller');

router.use(protect, adminOnly, schoolScope);

router.get('/students',     studentRoster);
router.get('/attendance',   attendanceReport);
router.get('/exams-list',   examsList);
router.get('/exam-results', examResultsReport);
router.get('/fees',         feeReport);
router.get('/report-card',  reportCard);

module.exports = router;
