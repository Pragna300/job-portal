const express = require('express');
const router = express.Router();
const { sendInterviewResultNotification } = require('../services/notificationService');

// POST /api/notifications/notify-manager-result
router.post('/notify-manager-result', async (req, res) => {
  const { managerId, candidateName, score, jobTitle, summary } = req.body;
  try {
    await sendInterviewResultNotification(managerId, candidateName, score, jobTitle, summary);
    res.json({ success: true, message: "Manager notified" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
