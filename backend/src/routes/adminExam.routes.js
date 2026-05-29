const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');
const { createExam, getExams, getExamResults, publishExam, unpublishExam, deleteExam, updateExam, adminEnterMarks, getExamStudents } = require('../controllers/adminExam.controller');

router.param('id', validateObjectId);

router.post('/',                 protect, adminOnly, schoolScope, createExam);
router.get('/',                  protect, adminOnly, schoolScope, getExams);
router.get('/:id/results',       protect, adminOnly, schoolScope, getExamResults);
router.get('/:id/students',      protect, adminOnly, schoolScope, getExamStudents);
router.patch('/:id/publish',     protect, adminOnly, schoolScope, publishExam);
router.patch('/:id/unpublish',   protect, adminOnly, schoolScope, unpublishExam);
router.put('/:id',               protect, adminOnly, schoolScope, updateExam);
router.delete('/:id',            protect, adminOnly, schoolScope, deleteExam);
router.post('/:id/marks',        protect, adminOnly, schoolScope, adminEnterMarks);

module.exports = router;
