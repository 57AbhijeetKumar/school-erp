const mongoose = require('mongoose');

/**
 * Collection: homeworks
 * Who: Any teacher can assign homework to any class in their school.
 * Rules: Only the teacher who assigned it can delete it.
 *        Class teacher sees ALL homework for their class.
 *        Other teachers see only their own assignments.
 */
const homeworkSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  subject:     { type: String, trim: true, maxlength: 100 },
  dueDate:      { type: Date },
  academicYear: { type: String, trim: true },  // "2024-25"
  class:        { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
  school:      { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  attachments: [{
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
    type:     { type: String, enum: ['image', 'pdf'], required: true },
    name:     { type: String, required: true },
  }],
}, { timestamps: true });

homeworkSchema.index({ class: 1, createdAt: -1 });
homeworkSchema.index({ assignedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Homework', homeworkSchema);
