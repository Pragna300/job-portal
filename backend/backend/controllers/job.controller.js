const Job = require('../models/job.model');
const Company = require('../models/company.model');

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const company = await Company.findByManagerId(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const jobData = { ...req.body, company_id: company.id };
    const jobId = await Job.create(jobData);
    res.status(201).json({ message: 'Job created successfully', jobId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Job.update(req.params.id, req.body);
    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use open or closed.' });
    }

    await Job.updateStatus(req.params.id, status);
    res.json({ message: 'Job status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const company = await Company.findByManagerId(req.user.id);
    if (job.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Job.delete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getJobs, getJob, createJob, updateJob, updateJobStatus, deleteJob };
