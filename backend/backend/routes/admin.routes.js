const express = require('express');
const {
  getStats,
  getUsers,
  getCompanies,
  getAdminJobs,
  approveCompany,
  updateUserStatus,
  updateCompanyStatus,
  updateAdminJobStatus,
} = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/companies', getCompanies);
router.get('/jobs', getAdminJobs);

router.put('/companies/:id/approve', approveCompany);
router.put('/users/:id/status', updateUserStatus);
router.put('/companies/:id/status', updateCompanyStatus);
router.put('/jobs/:id/status', updateAdminJobStatus);

module.exports = router;
