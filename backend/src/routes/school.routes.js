const router = require('express').Router();
const { protect, superAdminOnly } = require('../middleware/auth.middleware');
const {
  createSchool,
  getAllSchools,
  getSchool,
  updateSchool,
  toggleSchoolActive,
  updateSchoolSubscription,
  deactivateSchool,
} = require('../controllers/school.controller');

router.use(protect, superAdminOnly);

router.post('/',                         createSchool);
router.get('/',                          getAllSchools);
router.get('/:id',                       getSchool);
router.put('/:id',                       updateSchool);
router.patch('/:id/toggle',              toggleSchoolActive);
router.patch('/:id/subscription',        updateSchoolSubscription);
router.delete('/:id',                    deactivateSchool);

module.exports = router;
