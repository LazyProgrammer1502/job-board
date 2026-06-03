const express = require('express');
const router = express.Router();
const { getUser, uploadResume, uploadAvatar } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadResume: resumeUpload, uploadImage } = require('../config/cloudinary');

router.get('/:id', getUser); // public profile
router.put('/resume', protect, authorize('seeker'), resumeUpload.single('resume'), uploadResume);
router.put('/avatar', protect, uploadImage.single('avatar'), uploadAvatar);

module.exports = router;
