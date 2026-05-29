const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['school', 'coaching'], default: 'school' },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: false },
    subscription: {
      plan:          { type: String, enum: ['trial', 'monthly', 'quarterly', 'yearly'], default: 'trial' },
      monthlyCharge: { type: Number, default: 0 },
      startDate:     { type: Date },
      endDate:       { type: Date },
    },
    currentSession: { type: String, trim: true },  // "2025-26" — set by admin/superadmin
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('School', schoolSchema);
