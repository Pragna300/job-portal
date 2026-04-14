const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoring.controller');

// Import authentication and role middlewares
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public or User-facing routes
router.post('/start-session', proctoringController.startSession);

// Since the AI client might report violations via API we keep it unprotected for testing.
// Ideally, this could be restricted further, but we assume candidate's frontend triggers this.
router.post('/report-violation', proctoringController.reportViolation);

// Admin / Proctor only routes
router.post('/send-warning', authMiddleware, roleMiddleware('admin', 'manager'), proctoringController.sendWarning);
router.post('/terminate-interview', authMiddleware, roleMiddleware('admin', 'manager'), proctoringController.terminateInterview);
router.get('/live-candidates', authMiddleware, roleMiddleware('admin', 'manager'), proctoringController.getLiveCandidates);
router.get('/session-summary/:candidateId', authMiddleware, roleMiddleware('admin', 'manager'), proctoringController.getSessionSummary);
router.delete('/cleanup', authMiddleware, roleMiddleware('admin', 'manager'), proctoringController.cleanupSessions);

module.exports = router;
