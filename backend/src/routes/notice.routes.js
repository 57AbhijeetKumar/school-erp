const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  createNotice, getNotices, updateNotice, deleteNotice,
} = require('../controllers/notice.controller');

router.post('/',        protect, adminOnly, createNotice);
router.get('/',         protect, adminOnly, getNotices);
router.put('/:id',      protect, adminOnly, updateNotice);
router.delete('/:id',   protect, adminOnly, deleteNotice);

module.exports = router;
