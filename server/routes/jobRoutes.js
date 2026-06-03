const express = require('express');
const router = express.Router();
const {
  getJobs, getJob, createJob, updateJob, deleteJob,
  getMyJobs, toggleSaveJob, getSavedJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getJobs);
router.get('/my-jobs', protect, authorize('employer'), getMyJobs);
router.get('/saved', protect, authorize('seeker'), getSavedJobs);
router.get('/:id', getJob);

// Employer routes
router.post('/', protect, authorize('employer'), createJob);
router.put('/:id', protect, authorize('employer'), updateJob);
router.delete('/:id', protect, authorize('employer'), deleteJob);

// Seeker routes
router.put('/:id/save', protect, authorize('seeker'), toggleSaveJob);

module.exports = router;
