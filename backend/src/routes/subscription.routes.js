const router = require('express').Router();
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth.middleware');
const {
  getAdminSubscription,
  submitRechargeRequest,
  getMyRechargeRequests,
  getAllRechargeRequests,
  resolveRechargeRequest,
} = require('../controllers/subscription.controller');

// Admin routes (school admins only)
router.get('/',             protect, adminOnly, getAdminSubscription);
router.post('/request',     protect, adminOnly, submitRechargeRequest);
router.get('/my-requests',  protect, adminOnly, getMyRechargeRequests);

// SuperAdmin routes
router.get('/requests',              protect, superAdminOnly, getAllRechargeRequests);
router.patch('/requests/:id/resolve', protect, superAdminOnly, resolveRechargeRequest);

module.exports = router;
