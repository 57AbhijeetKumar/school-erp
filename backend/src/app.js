const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const isProd = process.env.NODE_ENV === 'production';

// ── CORS ──────────────────────────────────────────────────────────────────────
// Dev: accept any origin. Prod: only the domains listed in ALLOWED_ORIGINS.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = isProd
  ? {
      origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin "${origin}" not allowed`));
      },
      methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }
  : { origin: true, credentials: true };   // open in dev

// ── Rate limiters (shared with route files via middleware/rateLimiter.js) ─────
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

// Render (and most PaaS) terminate TLS and proxy requests via an internal load balancer.
// Without this, req.ip is always ::1 and all users share one rate-limit bucket.
app.set('trust proxy', 1);

// Security headers (helmet) — only in production to avoid dev friction
if (isProd) app.use(helmet());

// HTTP request logging
// dev: concise coloured output    prod: Apache Combined format (for log aggregators)
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));  // reject unexpectedly large bodies

// In production: intercept any 500+ JSON response and replace the raw error message
// so DB internals are never exposed to clients. Controllers keep their simple try/catch pattern.
if (isProd) {
  app.use((_req, res, next) => {
    const _json = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 500) {
        console.error('[500]', body?.message || body);
        return _json({ message: 'Internal Server Error' });
      }
      return _json(body);
    };
    next();
  });
}

// Apply the general limiter to all /api/* routes
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes                = require('./routes/auth.routes');
const schoolRoutes              = require('./routes/school.routes');
const userRoutes                = require('./routes/user.routes');
const teacherRoutes             = require('./routes/teacher.routes');
const classRoutes               = require('./routes/class.routes');
const studentRoutes             = require('./routes/student.routes');
const teacherAppRoutes          = require('./routes/teacherApp.routes');
const adminAttendanceRoutes     = require('./routes/adminAttendance.routes');
const adminHomeworkRoutes       = require('./routes/adminHomework.routes');
const adminExamRoutes           = require('./routes/adminExam.routes');
const adminFeeRoutes            = require('./routes/adminFee.routes');
const parentAppRoutes           = require('./routes/parentApp.routes');
const subscriptionRoutes        = require('./routes/subscription.routes');
const noticeRoutes              = require('./routes/notice.routes');
const timetableRoutes           = require('./routes/timetable.routes');
const studentLeaveRoutes        = require('./routes/studentLeave.routes');
const teacherLeaveRoutes        = require('./routes/teacherLeave.routes');
const complaintRoutes           = require('./routes/complaint.routes');
const subjectRoutes             = require('./routes/subject.routes');
const superadminAnalyticsRoutes = require('./routes/superadminAnalytics.routes');
const reportRoutes              = require('./routes/report.routes');
const substitutionRoutes        = require('./routes/substitution.routes');

app.get('/', (_req, res) => {
  res.json({ message: 'School ERP API is running', env: process.env.NODE_ENV });
});

// Auth routes get the stricter rate limiter
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/parent',        parentAppRoutes);   // authLimiter applied inside parentApp.routes.js

app.use('/api/schools',  schoolRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes',  classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/app',               teacherAppRoutes);
app.use('/api/attendance',        adminAttendanceRoutes);
app.use('/api/homework',          adminHomeworkRoutes);
app.use('/api/exams',             adminExamRoutes);
app.use('/api/fees',              adminFeeRoutes);
app.use('/api/subscription',      subscriptionRoutes);
app.use('/api/notices',           noticeRoutes);
app.use('/api/timetable',         timetableRoutes);
app.use('/api/leave-requests',    studentLeaveRoutes);
app.use('/api/teacher-leaves',    teacherLeaveRoutes);
app.use('/api/complaints',        complaintRoutes);
app.use('/api/subjects',          subjectRoutes);
app.use('/api/superadmin/analytics', superadminAnalyticsRoutes);
app.use('/api/reports',              reportRoutes);
app.use('/api/substitutions',        substitutionRoutes);

// ── 404 handler — catch unmatched routes and return JSON ─────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Never leak stack traces in production
  const status  = err.status || 500;
  const message = isProd && status === 500
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  if (isProd && status === 500) console.error(err);   // log full error server-side

  res.status(status).json({ message });
});

module.exports = app;
