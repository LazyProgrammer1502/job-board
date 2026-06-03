const express = require('express');
const router = express.Router();
const { createCompany, updateCompany, getMyCompany, getCompany } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

router.post('/', protect, authorize('employer'), uploadImage.single('logo'), createCompany);
router.put('/', protect, authorize('employer'), uploadImage.single('logo'), updateCompany);
router.get('/me', protect, authorize('employer'), getMyCompany);
router.get('/:id', getCompany); // public

module.exports = router;
