const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    school:         { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    content:        { type: String, required: true, trim: true, maxlength: 2000 },
    targetAudience: { type: String, enum: ['all', 'teachers', 'parents'], default: 'all' },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:       { type: Boolean, default: true },
    expiryDate:     { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
