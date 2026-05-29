const mongoose = require('mongoose');

const rechargeRequestSchema = new mongoose.Schema(
  {
    school:        { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    requestedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    plan:          { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
    amount:        { type: Number, required: true },
    note:          { type: String, default: '' },
    status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    resolvedAt:    { type: Date },
    resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RechargeRequest', rechargeRequestSchema);
