const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
    school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
    month:        { type: String, required: true },   // "YYYY-MM"
    academicYear: { type: String, trim: true },       // "2024-25"
    amount:       { type: Number, default: 0 },
    status:   { type: String, enum: ['paid', 'partial', 'due'], default: 'due' },
    paidAt:   { type: Date },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note:     { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

feeSchema.index({ school: 1, student: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
