const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const validateObjectId       = require('../middleware/validateObjectId');
const { getSubstitutionsForLeave, assignSubstitute } = require('../controllers/substitution.controller');

router.param('id', validateObjectId);

router.get('/',      protect, adminOnly, getSubstitutionsForLeave);
router.patch('/:id', protect, adminOnly, assignSubstitute);

module.exports = router;
