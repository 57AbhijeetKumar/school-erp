const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const {
  getComplaintsForAdmin,
  acknowledgeComplaint,
  resolveComplaint,
  deleteComplaintByAdmin,
} = require('../controllers/complaint.controller');

router.get('/',                  protect, adminOnly, schoolScope, getComplaintsForAdmin);
router.patch('/:id/acknowledge', protect, adminOnly, schoolScope, acknowledgeComplaint);
router.patch('/:id/resolve',     protect, adminOnly, schoolScope, resolveComplaint);
router.delete('/:id',            protect, adminOnly, schoolScope, deleteComplaintByAdmin);

module.exports = router;
