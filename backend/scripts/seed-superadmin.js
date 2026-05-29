/**
 * Creates a superadmin user in the target database.
 *
 * Usage:
 *   node scripts/seed-superadmin.js dev
 *   node scripts/seed-superadmin.js prod
 *
 * Credentials are printed to the console on first run.
 * Safe to re-run — exits cleanly if a superadmin already exists.
 */

const path    = require('path');
const env     = process.argv[2];

if (env !== 'dev' && env !== 'prod') {
  console.error('Usage: node scripts/seed-superadmin.js dev|prod');
  process.exit(1);
}

// Load the correct .env file BEFORE requiring mongoose / models
const envFile = path.join(__dirname, '..', env === 'prod' ? '.env.production' : '.env.development');
require('dotenv').config({ path: envFile });

const mongoose = require('mongoose');
const User     = require('../src/models/User');

// ── Credentials ───────────────────────────────────────────────────────────────
// Dev uses fixed easy-to-remember credentials (local only).
// Prod uses a strong fixed password — change it after first login.
const CREDENTIALS = {
  dev: {
    name:     'Super Admin',
    email:    'superadmin@erp.dev',
    password: 'superadmin123',
  },
  prod: {
    name:     'Super Admin',
    email:    'superadmin@erpapp.in',
    password: 'Erp@SuperAdmin2026!',
  },
};

const creds = CREDENTIALS[env];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to [${env.toUpperCase()}] database`);

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log(`\n✔  Superadmin already exists:`);
    console.log(`   Email : ${existing.email}`);
    console.log(`   (Password unchanged)\n`);
    await mongoose.disconnect();
    return;
  }

  await User.create({ ...creds, role: 'superadmin' });

  console.log(`\n✔  Superadmin created successfully!\n`);
  console.log(`   Email    : ${creds.email}`);
  console.log(`   Password : ${creds.password}`);
  if (env === 'prod') {
    console.log(`\n   ⚠️  Change this password after your first login.\n`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
