const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');
const { createTeacher, getAllTeachers, toggleTeacherActive, deleteTeacher } = require('../controllers/teacher.controller');

router.use(protect, adminOnly);
router.param('id', validateObjectId);

router.get('/',              getAllTeachers);
router.post('/',             createTeacher);
router.patch('/:id/status',  toggleTeacherActive);
router.delete('/:id',        deleteTeacher);

module.exports = router;
