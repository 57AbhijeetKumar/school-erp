const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
  homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student',  required: true },
  class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class',    required: true },
  school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School',   required: true },
  status:   { type: String, enum: ['submitted', 'not_submitted', 'late'], default: 'not_submitted' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher',  required: true },
  remark:   { type: String, trim: true, default: '' },
}, { timestamps: true });

homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });
homeworkSubmissionSchema.index({ homework: 1 });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
