const mongoose = require('mongoose');

/**
 * Collection: exams
 * Created by school admin. Each exam belongs to one class.
 * type 'unit_test'  → usually 1 subject, lower max marks (e.g. 25/50)
 * type 'annual'     → multiple subjects, full max marks (e.g. 100 each)
 */
const examSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 200 },
  type:       { type: String, enum: ['unit_test', 'annual'], required: true },
  class:      { type: mongoose.Schema.Types.ObjectId, ref: 'Class',  required: true },
  school:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subjects:   [{
    name:     { type: String, required: true },
    maxMarks: { type: Number, required: true, default: 100 },
  }],
  examDate:    { type: Date },
  isPublished: { type: Boolean, default: false },
  academicYear:{ type: String, trim: true },  // "2024-25"
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

examSchema.index({ class: 1, createdAt: -1 });
examSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('Exam', examSchema);
