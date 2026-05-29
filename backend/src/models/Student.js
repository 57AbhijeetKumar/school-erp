const mongoose = require('mongoose');

/**
 * Collection: students
 * Who: A student enrolled in a class at a school.
 * Login: Students do NOT log in (parent/student mobile app is future scope).
 * Cascade: Automatically deleted when their class is deleted.
 * Created by: School admin.
 */
const studentSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true, maxlength: 100 },
    rollNumber:       { type: String, trim: true, maxlength: 20 },   // e.g. "01", "A-12"
    parentName:       { type: String, trim: true, maxlength: 100 },
    parentMobile:     { type: String, trim: true, maxlength: 15 },   // 10-digit mobile for SMS
    dob:              { type: Date },
    enrolledClass:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    school:           { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    isActive:         { type: Boolean, default: true },
    isDeleted:        { type: Boolean, default: false },
    admissionSession: { type: String, trim: true },  // "2024-25" — immutable, year first enrolled
    currentSession:   { type: String, trim: true },  // "2025-26" — updated on promotion
  },
  { timestamps: true }
);

// Prevent duplicate roll numbers within the same class.
// partialFilterExpression ensures:
//  - null/undefined rollNumbers are not indexed (same effect as sparse)
//  - soft-deleted students do not block roll number reuse
studentSchema.index(
  { school: 1, enrolledClass: 1, rollNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      rollNumber: { $exists: true, $type: 'string' },
      isDeleted:  { $ne: true },
    },
  }
);

module.exports = mongoose.model('Student', studentSchema);
