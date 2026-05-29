const express = require('express');
const router  = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth.middleware');
const {
  getOverview, getExpiryAlerts, getRevenueReport, getSchoolGrowth,
} = require('../controllers/superadminAnalytics.controller');

router.get('/overview',       protect, superAdminOnly, getOverview);
router.get('/expiry-alerts',  protect, superAdminOnly, getExpiryAlerts);
router.get('/revenue',        protect, superAdminOnly, getRevenueReport);
router.get('/school-growth',  protect, superAdminOnly, getSchoolGrowth);

module.exports = router;
