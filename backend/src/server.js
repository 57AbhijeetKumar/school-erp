// Load the environment file that matches NODE_ENV before anything else.
// npm run dev  → sets NODE_ENV=development → loads .env.development
// npm start    → sets NODE_ENV=production  → loads .env.production
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: envFile });

const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;
const ENV  = process.env.NODE_ENV || 'development';

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[${ENV.toUpperCase()}] Server running on port ${PORT}`);
  });
});
