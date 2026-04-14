const express = require('express');
const { getProfile, updateProfile, getDashboardStats } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['client']));

router.get('/profile', getProfile);
router.put('/profile', upload.single('resume'), updateProfile);
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
