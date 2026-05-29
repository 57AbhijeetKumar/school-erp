const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');
const { addStudent, getStudentsByClass, updateStudent, deleteStudent, getStudentDeleteInfo, promoteStudents } = require('../controllers/student.controller');

router.use(protect, adminOnly);
router.param('id',      validateObjectId);
router.param('classId', validateObjectId);

router.get('/class/:classId',    getStudentsByClass);
router.get('/:id/delete-info',   getStudentDeleteInfo);
router.post('/promote',          promoteStudents);
router.post('/',                 addStudent);
router.put('/:id',               updateStudent);
router.delete('/:id',            deleteStudent);

module.exports = router;
