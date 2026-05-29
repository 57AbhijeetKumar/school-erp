const School          = require('../models/School');
const Student         = require('../models/Student');
const Teacher         = require('../models/Teacher');
const RechargeRequest = require('../models/RechargeRequest');

// GET /api/superadmin/analytics/overview
const getOverview = async (req, res) => {
  try {
    const [totalSchools, activeSchools, totalStudents, totalTeachers, revenueAgg] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ isActive: true }),
      Student.countDocuments(),
      Teacher.countDocuments(),
      RechargeRequest.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    res.json({
      totalSchools,
      activeSchools,
      inactiveSchools: totalSchools - activeSchools,
      totalStudents,
      totalTeachers,
      totalRevenue: revenue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/analytics/expiry-alerts
// Returns schools whose subscription ends within the next `days` days (default 30)
const getExpiryAlerts = async (req, res) => {
  try {
    const days    = parseInt(req.query.days) || 30;
    const now     = new Date();
    const cutoff  = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const schools = await School.find({
      isActive:                 true,
      'subscription.endDate':   { $lte: cutoff, $gte: now },
    }).select('name email phone subscription isActive').sort({ 'subscription.endDate': 1 });

    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/analytics/revenue
// Monthly revenue breakdown for the last `months` months (default 12)
const getRevenueReport = async (req, res) => {
  try {
    const months  = parseInt(req.query.months) || 12;
    const since   = new Date();
    since.setMonth(since.getMonth() - months);

    const monthly = await RechargeRequest.aggregate([
      { $match: { status: 'approved', resolvedAt: { $gte: since } } },
      {
        $group: {
          _id:    { year: { $year: '$resolvedAt' }, month: { $month: '$resolvedAt' } },
          total:  { $sum: '$amount' },
          count:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json(monthly);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/analytics/school-growth
// New schools registered per month
const getSchoolGrowth = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const since  = new Date();
    since.setMonth(since.getMonth() - months);

    const growth = await School.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json(growth);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOverview, getExpiryAlerts, getRevenueReport, getSchoolGrowth };
