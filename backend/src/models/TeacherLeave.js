const mongoose = require('mongoose');

const teacherLeaveSchema = new mongoose.Schema(
  {
    school:        { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
    teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    fromDate:      { type: Date, required: true },
    toDate:        { type: Date, required: true },
    reason:        { type: String, required: true, trim: true },
    leaveType:     { type: String, enum: ['sick', 'casual', 'personal'], default: 'casual' },
    status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    resolvedAt:    { type: Date },
    resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeacherLeave', teacherLeaveSchema);
