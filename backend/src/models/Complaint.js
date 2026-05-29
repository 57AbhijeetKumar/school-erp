const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    school:               { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
    raisedByRole:         { type: String, enum: ['teacher', 'admin', 'parent'],   required: true },
    raisedByTeacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    raisedByAdmin:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    raisedByParentMobile: { type: String },
    raisedByName:         { type: String, required: true },
    student:              { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class:                { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
    category: {
      type: String,
      enum: ['misbehavior','academic','attendance','bullying','property_damage','home_concern','other'],
      required: true,
    },
    severity:     { type: String, enum: ['low','medium','high'], required: true },
    title:        { type: String, required: true, trim: true },
    description:  { type: String, required: true, trim: true },
    status:       { type: String, enum: ['open','acknowledged','resolved'], default: 'open' },
    resolvedAt:   { type: Date },
    resolvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
