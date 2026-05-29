const mongoose = require('mongoose');

/**
 * Collection: classes
 * Who: A class/grade inside a school (e.g. "Class 5 - A").
 * Each class can have one class teacher assigned from the teachers collection.
 * Deleting a class CASCADES and permanently deletes all its students.
 * Created by: School admin.
 */
const classSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 100 },  // e.g. "Class 1", "10th"
    section:      { type: String, trim: true, maxlength: 50 },                   // e.g. "A", "B" (optional)
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    school:       { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
