const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const { getClassFees, markFee, markBulkFee } = require('../controllers/adminFee.controller');

router.get('/',           protect, adminOnly, schoolScope, getClassFees);
router.post('/mark',      protect, adminOnly, schoolScope, markFee);
router.post('/mark-bulk', protect, adminOnly, schoolScope, markBulkFee);

module.exports = router;
