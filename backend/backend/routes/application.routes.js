const express = require('express');
const { applyForJob, getMyApplications, getApplicationsForJob, updateApplicationStatus, updateTestScore, managerApproveForInterview, markTestCompleted, hardDeleteApplication } = require('../controllers/application.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// ── Internal route (AI-Backend → Main Backend, x-internal-key protected, NO JWT) ───
router.post('/internal/mark-completed', markTestCompleted);

router.use(authMiddleware);

const handleResumeUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Resume upload failed' });
    }
    return next();
  });
};

router.post('/apply-job', roleMiddleware(['client']), handleResumeUpload, applyForJob);
router.post('/', roleMiddleware(['client']), handleResumeUpload, applyForJob);
router.get('/my', roleMiddleware(['client']), getMyApplications);
router.get('/job/:id', roleMiddleware(['manager']), getApplicationsForJob);
router.put('/:id', roleMiddleware(['manager']), updateApplicationStatus);

// API Endpoints for ATS Test evaluation & Manager controls
router.post('/update-test-score', updateTestScore);
router.patch('/manager-approve/:id', roleMiddleware(['manager']), managerApproveForInterview);

// Hard-delete a candidate (manager/admin) — removes all related DB records
router.delete('/:id/hard-delete', roleMiddleware(['manager', 'admin']), hardDeleteApplication);

module.exports = router;