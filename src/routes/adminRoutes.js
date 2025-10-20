const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAuth, requireAdmin, adminController.stats);
router.get('/users', requireAuth, requireAdmin, adminController.listUsers);
router.get('/users/search', requireAuth, requireAdmin, adminController.searchUsers);
router.get('/activity', requireAuth, requireAdmin, adminController.activity);

module.exports = router;
