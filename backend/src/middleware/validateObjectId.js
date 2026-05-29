const { isValid } = require('mongoose').Types.ObjectId;

// Express router.param handler — rejects non-ObjectId values with 400.
const validateObjectId = (_req, res, next, val) => {
  if (!isValid(val) || String(val).length !== 24) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

module.exports = validateObjectId;
