const express = require("express");
const router = express.Router();
const proctoringController = require("../controllers/proctoring.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post("/start-session", proctoringController.startSession);
router.post("/report-violation", proctoringController.reportViolation);
router.post("/terminate-interview", proctoringController.terminateSession);
router.post("/disqualify", proctoringController.disqualifyCandidate);

router.get("/live-candidates", authMiddleware, roleMiddleware(['manager', 'admin']), proctoringController.getSessions);
router.get("/session-summary/:candidateId", authMiddleware, proctoringController.getSessionSummary);
router.get("/top-candidates/:jobId", authMiddleware, proctoringController.getTopCandidates);

module.exports = router;
