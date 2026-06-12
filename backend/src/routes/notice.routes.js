const express = require('express');
const router  = express.Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const {
  createNotice, getNotices, updateNotice, deleteNotice,
} = require('../controllers/notice.controller');

router.post('/',        protect, adminOnly, schoolScope, createNotice);
router.get('/',         protect, adminOnly, schoolScope, getNotices);
router.put('/:id',      protect, adminOnly, schoolScope, updateNotice);
router.delete('/:id',   protect, adminOnly, schoolScope, deleteNotice);

module.exports = router;
