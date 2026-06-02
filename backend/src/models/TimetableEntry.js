const mongoose = require('mongoose');

// Flat projection of every teacher-assigned period across all class timetables.
// Only rows where teacherName is non-empty are stored here.
// The compound unique index on (school, teacherName, day, periodNumber) is the
// DB-level guarantee that a teacher cannot be in two classes at the same time.
const timetableEntrySchema = new mongoose.Schema(
  {
    school:       { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    class:        { type: mongoose.Schema.Types.ObjectId, ref: 'Class',  required: true },
    day:          { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
    periodNumber: { type: Number, required: true },
    subject:      { type: String, required: true, trim: true },
    teacherName:  { type: String, required: true, trim: true },
    startTime:    { type: String, default: '' },
    endTime:      { type: String, default: '' },
  },
  { timestamps: true }
);

// One slot per class — no duplicate period within the same class on the same day
timetableEntrySchema.index({ school: 1, class: 1, day: 1, periodNumber: 1 }, { unique: true });

// THE key constraint: a teacher can only be assigned to one class per day+period
timetableEntrySchema.index({ school: 1, teacherName: 1, day: 1, periodNumber: 1 }, { unique: true });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
