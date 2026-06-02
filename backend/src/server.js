// Load the environment file that matches NODE_ENV before anything else.
// npm run dev  → sets NODE_ENV=development → loads .env.development
// npm start    → sets NODE_ENV=production  → loads .env.production
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: envFile });

const app            = require('./app');
const connectDB      = require('./config/db');
const Timetable      = require('./models/Timetable');
const TimetableEntry = require('./models/TimetableEntry');

const PORT = process.env.PORT || 8000;
const ENV  = process.env.NODE_ENV || 'development';

// One-time backfill: populate TimetableEntry from existing Timetable docs so
// that conflict detection works correctly for timetables saved before this
// feature was introduced. Safe to run on every restart — skips schools that
// already have entries.
async function backfillTimetableEntries() {
  try {
    const existingCount = await TimetableEntry.estimatedDocumentCount();
    const timetableCount = await Timetable.estimatedDocumentCount();
    if (existingCount > 0 || timetableCount === 0) return; // already done or nothing to migrate

    console.log('[migration] Backfilling TimetableEntry from existing Timetable docs…');
    const timetables = await Timetable.find({});
    const entries = [];

    for (const tt of timetables) {
      for (const day of tt.schedule) {
        for (const period of (day.periods || [])) {
          if (period.teacherName?.trim() && period.subject?.trim()) {
            entries.push({
              school:       tt.school,
              class:        tt.class,
              day:          day.day,
              periodNumber: period.periodNumber,
              subject:      period.subject.trim(),
              teacherName:  period.teacherName.trim(),
              startTime:    period.startTime || '',
              endTime:      period.endTime   || '',
            });
          }
        }
      }
    }

    if (entries.length > 0) {
      await TimetableEntry.insertMany(entries, { ordered: false });
      console.log(`[migration] Backfilled ${entries.length} TimetableEntry rows.`);
    } else {
      console.log('[migration] No teacher assignments found — nothing to backfill.');
    }
  } catch (err) {
    // Duplicate key errors mean some entries already existed — not fatal
    if (err.code !== 11000) {
      console.error('[migration] TimetableEntry backfill error:', err.message);
    }
  }
}

connectDB().then(async () => {
  await backfillTimetableEntries();
  app.listen(PORT, () => {
    console.log(`[${ENV.toUpperCase()}] Server running on port ${PORT}`);
  });
});
