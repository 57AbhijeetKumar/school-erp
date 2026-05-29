const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * Collection: teachers
 * Who: School teachers who log in via the mobile app using their mobile number.
 * Created by: School admin.
 * Default password: 123456 (set at creation, teacher can change via mobile app later).
 */
const teacherSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    mobile:   { type: String, required: true, unique: true, trim: true, maxlength: 15 },
    password: { type: String, required: true },
    subject:  { type: String, trim: true, maxlength: 100 },
    email:    { type: String, trim: true, lowercase: true, maxlength: 200 },
    school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    isActive:     { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

teacherSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
