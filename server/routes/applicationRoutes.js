const express = require('express');
const router = express.Router();
const {
  applyForJob, getMyApplications, withdrawApplication,
  getJobApplicants, updateApplicationStatus, getApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { uploadResume } = require('../config/cloudinary');

// Seeker routes
router.post('/:jobId', protect, authorize('seeker'), uploadResume.single('resume'), applyForJob);
router.get('/my', protect, authorize('seeker'), getMyApplications);
router.delete('/:id', protect, authorize('seeker'), withdrawApplication);

// Employer routes
router.get('/job/:jobId', protect, authorize('employer'), getJobApplicants);
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);

// Shared (applicant or employer)
router.get('/:id', protect, getApplication);

module.exports = router;
