const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema(
  {
    school:                { type: mongoose.Schema.Types.ObjectId, ref: 'School',      required: true },
    leaveId:               { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherLeave', required: true },
    date:                  { type: Date,   required: true },
    dayName:               { type: String, required: true },
    classId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    className:             { type: String, required: true },
    periodNumber:          { type: Number, required: true },
    subject:               { type: String, required: true },
    startTime:             { type: String, default: '' },
    endTime:               { type: String, default: '' },
    absentTeacherId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    absentTeacherName:     { type: String, required: true },
    substituteTeacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    substituteTeacherName: { type: String, default: '' },
    status:                { type: String, enum: ['unassigned', 'assigned'], default: 'unassigned' },
  },
  { timestamps: true }
);

substitutionSchema.index({ school: 1, leaveId: 1 });
substitutionSchema.index({ school: 1, substituteTeacherId: 1, date: 1 });

module.exports = mongoose.model('Substitution', substitutionSchema);
