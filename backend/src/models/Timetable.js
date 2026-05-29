const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    periodNumber: { type: Number, required: true },
    subject:      { type: String, required: true, trim: true },
    teacherName:  { type: String, trim: true, default: '' },
    startTime:    { type: String, default: '' },
    endTime:      { type: String, default: '' },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day:     { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
    periods: [periodSchema],
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class',  required: true },
    schedule: [daySchema],
  },
  { timestamps: true }
);

timetableSchema.index({ school: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
