const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');
const { createClass, getAllClasses, assignTeacher, deleteClass } = require('../controllers/class.controller');

router.use(protect, adminOnly);
router.param('id', validateObjectId);

router.get('/',               getAllClasses);
router.post('/',              createClass);
router.put('/:id/teacher',    assignTeacher);
router.delete('/:id',         deleteClass);

module.exports = router;
