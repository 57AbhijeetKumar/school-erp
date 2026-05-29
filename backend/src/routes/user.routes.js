const router = require('express').Router();
const { protect, adminOnly, schoolScope } = require('../middleware/auth.middleware');
const { getAll, getById, update, remove } = require('../controllers/user.controller');

router.use(protect, schoolScope);

router.get('/', adminOnly, getAll);
router.get('/:id', getById);
router.put('/:id', adminOnly, update);
router.delete('/:id', adminOnly, remove);

module.exports = router;
