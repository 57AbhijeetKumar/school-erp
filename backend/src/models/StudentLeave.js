const mongoose = require('mongoose');

const studentLeaveSchema = new mongoose.Schema(
  {
    school:           { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
    student:          { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class:            { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
    parentMobile:     { type: String, required: true },
    fromDate:         { type: Date, required: true },
    toDate:           { type: Date, required: true },
    reason:           { type: String, required: true, trim: true },
    status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    resolvedAt:       { type: Date },
    resolvedByRole:   { type: String, enum: ['teacher', 'admin'] },
    resolvedByTeacher:{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    resolvedByAdmin:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionNote:    { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentLeave', studentLeaveSchema);
