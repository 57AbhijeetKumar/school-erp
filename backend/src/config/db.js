const mongoose = require('mongoose');

// Drops the old sparse-only roll-number index so Mongoose can recreate it
// with partialFilterExpression (excludes soft-deleted students).
// Safe to run on every startup: no-op if the old index no longer exists.
async function migratStudentRollIndex() {
  try {
    const col = mongoose.connection.collection('students');
    const OLD = 'school_1_enrolledClass_1_rollNumber_1';
    const indexes = await col.indexes();
    const exists  = indexes.some(i => i.name === OLD && !i.partialFilterExpression);
    if (exists) {
      await col.dropIndex(OLD);
      console.log('[migration] Dropped old student roll-number index — Mongoose will recreate it with partialFilterExpression');
    }
  } catch (e) {
    // Non-fatal — the app-level duplicate check in the controller is the primary guard
    console.warn('[migration] Could not migrate student roll-number index:', e.message);
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    await migratStudentRollIndex();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
