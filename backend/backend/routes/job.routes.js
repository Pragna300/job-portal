const express = require('express');
const { getJobs, getJob, createJob, updateJob, updateJobStatus, deleteJob } = require('../controllers/job.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJob);

router.use(authMiddleware);

router.post('/', roleMiddleware(['manager']), createJob);
router.put('/:id', roleMiddleware(['manager']), updateJob);
router.patch('/:id/status', roleMiddleware(['manager']), updateJobStatus);
router.delete('/:id', roleMiddleware(['manager']), deleteJob);

module.exports = router;
