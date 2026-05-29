const router = require('express').Router();
const { setupSuperAdmin, login, teacherMobileLogin, adminLogout, teacherLogout } = require('../controllers/auth.controller');
const { protect, teacherProtect } = require('../middleware/auth.middleware');

router.post('/setup',           setupSuperAdmin);
router.post('/login',           login);
router.post('/logout',          protect, adminLogout);
router.post('/teacher/login',   teacherMobileLogin);
router.post('/teacher/logout',  teacherProtect, teacherLogout);

module.exports = router;
