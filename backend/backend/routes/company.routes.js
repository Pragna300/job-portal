const express = require('express');
const { getProfile, updateProfile, getMyJobs, getDashboardStats, scheduleInterview, rejectCandidate } = require('../controllers/company.controller');
const { sendInterviewLink, getInterviewResults } = require('../controllers/interviewLinks.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);

// New additive APIs (manager/admin)
router.post('/send-interview-link/:user_id', roleMiddleware(['manager', 'admin']), sendInterviewLink);
router.get('/interview-results/:user_id', roleMiddleware(['manager', 'admin']), getInterviewResults);

// Existing company panel behavior (manager only)
router.use(roleMiddleware(['manager']));

router.get('/profile', getProfile);
router.put('/profile', upload.single('logo'), updateProfile);
router.get('/my-company', getProfile);
router.get('/jobs', getMyJobs);
router.get('/dashboard-stats', getDashboardStats);

router.patch('/schedule-interview/:id', scheduleInterview);
router.patch('/reject-candidate/:id', rejectCandidate);

module.exports = router;
