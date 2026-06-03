const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────
// @desc    Create company profile (employer)
// @route   POST /api/companies
// @access  Private (employer only)
// ─────────────────────────────────────────
const createCompany = asyncHandler(async (req, res) => {
  const existing = await Company.findOne({ owner: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a company profile.' });
  }

  const { name, website, bio, location, size, industry } = req.body;

  const company = await Company.create({
    name,
    website,
    bio,
    location,
    size,
    industry,
    owner: req.user._id,
    logo: req.file?.path || '',
  });

  // Link company to user
  await User.findByIdAndUpdate(req.user._id, { company: company._id });

  res.status(201).json({ success: true, company });
});

// ─────────────────────────────────────────
// @desc    Update company profile
// @route   PUT /api/companies
// @access  Private (employer only)
// ─────────────────────────────────────────
const updateCompany = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'website', 'bio', 'location', 'size', 'industry'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (req.file?.path) updates.logo = req.file.path;

  const company = await Company.findOneAndUpdate(
    { owner: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!company) {
    return res.status(404).json({ success: false, message: 'Company profile not found. Create one first.' });
  }

  res.status(200).json({ success: true, company });
});

// ─────────────────────────────────────────
// @desc    Get logged-in employer's company
// @route   GET /api/companies/me
// @access  Private (employer only)
// ─────────────────────────────────────────
const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  if (!company) {
    return res.status(404).json({ success: false, message: 'No company profile found.' });
  }
  res.status(200).json({ success: true, company });
});

// ─────────────────────────────────────────
// @desc    Get company by ID (public)
// @route   GET /api/companies/:id
// @access  Public
// ─────────────────────────────────────────
const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).populate('owner', 'name email');
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found.' });
  }

  // Also return active jobs from this company
  const jobs = await Job.find({ company: company._id, isActive: true })
    .sort({ createdAt: -1 })
    .select('title location type salary createdAt');

  res.status(200).json({ success: true, company, jobs });
});

module.exports = { createCompany, updateCompany, getMyCompany, getCompany };
