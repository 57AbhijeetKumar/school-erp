const School          = require('../models/School');
const User            = require('../models/User');
const RechargeRequest = require('../models/RechargeRequest');

const PLAN_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/subscription
const getAdminSubscription = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) return res.status(403).json({ message: 'Not associated with a school' });

    const school = await School.findById(schoolId).select('name isActive subscription');
    if (!school) return res.status(404).json({ message: 'School not found' });

    const pendingRequest = await RechargeRequest.findOne({ school: schoolId, status: 'pending' })
      .select('plan amount note createdAt');

    const lastApproved = await RechargeRequest.findOne({ school: schoolId, status: 'approved' })
      .sort({ resolvedAt: -1 })
      .select('plan amount resolvedAt');

    res.json({
      isActive:     school.isActive,
      subscription: school.subscription,
      pendingRequest,
      lastApproved,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/subscription/request
const submitRechargeRequest = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) return res.status(403).json({ message: 'Not associated with a school' });

    const { plan, amount, note } = req.body;
    if (!plan || !PLAN_DAYS[plan]) {
      return res.status(400).json({ message: 'plan must be monthly, quarterly, or yearly' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'amount is required and must be positive' });
    }

    const existing = await RechargeRequest.findOne({ school: schoolId, status: 'pending' });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending recharge request. Please wait for it to be resolved.' });
    }

    const request = await RechargeRequest.create({
      school:      schoolId,
      requestedBy: req.user.id,
      plan,
      amount:      Number(amount),
      note:        note || '',
    });

    res.status(201).json({ message: 'Recharge request submitted successfully', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/subscription/my-requests
const getMyRechargeRequests = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const requests = await RechargeRequest.find({ school: schoolId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── SuperAdmin ────────────────────────────────────────────────────────────────

// GET /api/subscription/requests  — all requests (optionally ?status=pending)
const getAllRechargeRequests = async (_req, res) => {
  try {
    const requests = await RechargeRequest.find()
      .populate('school',      'name type city isActive subscription')
      .populate('requestedBy', 'name email')
      .populate('resolvedBy',  'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/subscription/requests/:id/resolve  — approve or reject
const resolveRechargeRequest = async (req, res) => {
  try {
    const { action, rejectionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const request = await RechargeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been resolved' });
    }

    request.status     = action === 'approve' ? 'approved' : 'rejected';
    request.resolvedAt = new Date();
    request.resolvedBy = req.user.id;
    if (action === 'reject') request.rejectionNote = rejectionNote || '';
    await request.save();

    if (action === 'approve') {
      const school = await School.findById(request.school);
      if (school) {
        const now     = new Date();
        const current = school.subscription?.endDate;
        const base    = current && current > now ? new Date(current) : new Date(now);
        base.setDate(base.getDate() + (PLAN_DAYS[request.plan] || 30));

        school.subscription.plan      = request.plan;
        school.subscription.endDate   = base;
        school.subscription.startDate = school.subscription.startDate || now;
        school.isActive = true;
        await school.save();

        await User.updateMany({ school: school._id, role: 'admin' }, { isActive: true });
      }
    }

    res.json({ message: `Request ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAdminSubscription,
  submitRechargeRequest,
  getMyRechargeRequests,
  getAllRechargeRequests,
  resolveRechargeRequest,
};
