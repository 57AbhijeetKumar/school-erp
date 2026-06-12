const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subject.controller');

router.use(protect, adminOnly, schoolScope);

router.get('/',       getSubjects);
router.post('/',      createSubject);
router.put('/:id',    updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
