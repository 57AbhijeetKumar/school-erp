const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getComplaintsForAdmin,
  acknowledgeComplaint,
  resolveComplaint,
  deleteComplaintByAdmin,
} = require('../controllers/complaint.controller');

router.get('/',                  protect, adminOnly, getComplaintsForAdmin);
router.patch('/:id/acknowledge', protect, adminOnly, acknowledgeComplaint);
router.patch('/:id/resolve',     protect, adminOnly, resolveComplaint);
router.delete('/:id',            protect, adminOnly, deleteComplaintByAdmin);

module.exports = router;
