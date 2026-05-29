const mongoose = require('mongoose');

/**
 * Collection: examresults
 * One document per student per exam.
 * Automatically recalculates total, percentage and grade on save.
 */
const examResultSchema = new mongoose.Schema({
  exam:     { type: mongoose.Schema.Types.ObjectId, ref: 'Exam',    required: true },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
  school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  marks: [{
    subject:  { type: String, required: true },
    obtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true },
  }],
  totalObtained: { type: Number, default: 0 },
  totalMax:      { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  grade:         { type: String, default: 'F' },
  enteredBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: true });

// One result per student per exam
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });
examResultSchema.index({ exam: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
