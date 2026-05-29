const mongoose = require('mongoose');

/**
 * Collection: attendances
 * Who: One record per student per date, marked by the class teacher via mobile app.
 * Cascade: Automatically deleted when their student is deleted (see student.controller.js).
 */
const attendanceSchema = new mongoose.Schema({
  date:     { type: Date, required: true },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
  school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  status:   { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

// One record per student per day
attendanceSchema.index({ date: 1, student: 1 }, { unique: true });
attendanceSchema.index({ date: 1, class: 1 });
attendanceSchema.index({ student: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
