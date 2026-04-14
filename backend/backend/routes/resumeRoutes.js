const express = require('express');
const { applyForJob } = require('../controllers/application.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);
const handleResumeUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Resume upload failed' });
    }
    return next();
  });
};

router.post('/upload', roleMiddleware(['client']), handleResumeUpload, applyForJob);

module.exports = router;
