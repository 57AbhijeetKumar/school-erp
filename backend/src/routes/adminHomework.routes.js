const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const { getClassHomework, createHomework, deleteHomework } = require('../controllers/adminHomework.controller');
const { getHomeworkSubmissions }           = require('../controllers/adminSubmission.controller');

router.get('/class/:classId',          protect, adminOnly, schoolScope, getClassHomework);
router.post('/',                       protect, adminOnly, schoolScope, createHomework);
router.get('/:homeworkId/submissions', protect, adminOnly, schoolScope, getHomeworkSubmissions);
router.delete('/:id',                  protect, adminOnly, schoolScope, deleteHomework);

module.exports = router;
