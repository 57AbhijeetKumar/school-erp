const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  code:     { type: String, trim: true },
  school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

subjectSchema.index({ school: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
