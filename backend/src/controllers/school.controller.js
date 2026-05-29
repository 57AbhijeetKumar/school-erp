const School = require('../models/School');
const User   = require('../models/User');

const TRIAL_DAYS = 30;
const PLAN_DAYS  = { monthly: 30, quarterly: 90, yearly: 365 };

// POST /api/schools  — superadmin creates a school + its admin user
const createSchool = async (req, res) => {
  try {
    const {
      name, type, address, city, state, phone, email,
      subscription,
      adminName, adminEmail, adminPassword,
    } = req.body;

    if (!name || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: 'name, adminName, adminEmail and adminPassword are required',
      });
    }

    const emailTaken = await User.findOne({ email: adminEmail });
    if (emailTaken) {
      return res.status(409).json({ message: 'Admin email already in use' });
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    const school = await School.create({
      name, type, address, city, state, phone, email,
      isActive: true,
      subscription: {
        plan:          'trial',
        monthlyCharge: subscription?.monthlyCharge || 0,
        startDate:     new Date(),
        endDate:       trialEnd,
      },
      createdBy: req.user.id,
    });

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      school: school._id,
    });

    school.adminUser = adminUser._id;
    await school.save();

    res.status(201).json({
      message: 'School created successfully with 30-day trial',
      school: {
        id:           school._id,
        name:         school.name,
        type:         school.type,
        city:         school.city,
        isActive:     school.isActive,
        subscription: school.subscription,
      },
      admin: {
        id:    adminUser._id,
        name:  adminUser.name,
        email: adminUser.email,
        role:  adminUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schools
const getAllSchools = async (_req, res) => {
  try {
    const schools = await School.find()
      .populate('adminUser', 'name email')
      .sort({ createdAt: -1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schools/:id
const getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('adminUser', 'name email')
      .populate('createdBy', 'name email');
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/schools/:id
const updateSchool = async (req, res) => {
  try {
    const { name, type, address, city, state, phone, email, isActive, subscription } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { name, type, address, city, state, phone, email, isActive, subscription },
      { new: true, runValidators: true }
    );
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/schools/:id/toggle  — activate / deactivate school
const toggleSchoolActive = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    school.isActive = !school.isActive;
    await school.save();

    await User.updateMany({ school: school._id, role: 'admin' }, { isActive: school.isActive });

    res.json({
      message:  `School "${school.name}" has been ${school.isActive ? 'activated' : 'deactivated'}.`,
      isActive: school.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/schools/:id/subscription  — superadmin manually sets subscription plan + expiry
const updateSchoolSubscription = async (req, res) => {
  try {
    const { plan, months, amount } = req.body;
    if (!plan || !PLAN_DAYS[plan]) {
      return res.status(400).json({ message: 'plan must be monthly, quarterly, or yearly' });
    }

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const now     = new Date();
    const current = school.subscription?.endDate;
    const base    = current && current > now ? new Date(current) : new Date(now);
    const days    = months ? months * 30 : PLAN_DAYS[plan];
    base.setDate(base.getDate() + days);

    school.subscription.plan          = plan;
    school.subscription.endDate       = base;
    school.subscription.startDate     = school.subscription.startDate || now;
    if (amount !== undefined) school.subscription.monthlyCharge = Number(amount);
    school.isActive = true;
    await school.save();

    await User.updateMany({ school: school._id, role: 'admin' }, { isActive: true });

    res.json({ message: 'Subscription updated', subscription: school.subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/schools/:id  — soft delete (deactivate)
const deactivateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: 'School not found' });
    await User.updateMany({ school: school._id }, { isActive: false });
    res.json({ message: 'School deactivated', school });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSchool,
  getAllSchools,
  getSchool,
  updateSchool,
  toggleSchoolActive,
  updateSchoolSubscription,
  deactivateSchool,
};
