const Job = require('../models/Job');
const Company = require('../models/Company');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────
// @desc    Get all jobs (public) with search, filter, sort, pagination
// @route   GET /api/jobs
// @access  Public
// ─────────────────────────────────────────
const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    type,
    experience,
    minSalary,
    maxSalary,
    skills,
    sort = 'newest',
    page = 1,
    limit = 10,
  } = req.query;

  const query = { isActive: true };

  // Full-text search on title, description, skills
  if (search) {
    query.$text = { $search: search };
  }

  // Filters
  if (location) query.location = { $regex: location, $options: 'i' };
  if (type) query.type = type;
  if (experience) query.experience = experience;
  if (skills) {
    const skillsArr = skills.split(',').map((s) => s.trim());
    query.skills = { $in: skillsArr };
  }
  if (minSalary || maxSalary) {
    query['salary.min'] = {};
    if (minSalary) query['salary.min'].$gte = Number(minSalary);
    if (maxSalary) query['salary.min'].$lte = Number(maxSalary);
  }

  // Sort
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    salary_high: { 'salary.max': -1 },
    salary_low: { 'salary.min': 1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .populate('company', 'name logo location')
      .populate('employer', 'name'),
    Job.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    jobs,
  });
});

// ─────────────────────────────────────────
// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
// ─────────────────────────────────────────
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('company', 'name logo location website bio size industry')
    .populate('employer', 'name email');

  if (!job || !job.isActive) {
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  // Increment view count
  await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json({ success: true, job });
});

// ─────────────────────────────────────────
// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (employer only)
// ─────────────────────────────────────────
const createJob = asyncHandler(async (req, res) => {
  const {
    title, description, requirements, skills,
    salary, location, type, experience, deadline,
  } = req.body;

  // Attach employer and their company (if exists)
  const company = await Company.findOne({ owner: req.user._id });

  const job = await Job.create({
    title,
    description,
    requirements,
    skills: skills || [],
    salary: salary || {},
    location,
    type,
    experience: experience || 'entry',
    deadline: deadline || null,
    employer: req.user._id,
    company: company?._id || null,
  });

  await job.populate('company', 'name logo location');

  res.status(201).json({ success: true, job });
});

// ─────────────────────────────────────────
// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (employer — own jobs only)
// ─────────────────────────────────────────
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  // Ensure the logged-in employer owns this job
  if (job.employer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this job.' });
  }

  const allowedUpdates = [
    'title', 'description', 'requirements', 'skills',
    'salary', 'location', 'type', 'experience', 'deadline', 'isActive',
  ];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const updated = await Job.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('company', 'name logo location');

  res.status(200).json({ success: true, job: updated });
});

// ─────────────────────────────────────────
// @desc    Delete a job (soft delete — sets isActive: false)
// @route   DELETE /api/jobs/:id
// @access  Private (employer — own jobs only)
// ─────────────────────────────────────────
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this job.' });
  }

  // Soft delete — keeps the data, hides from listings
  await Job.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(200).json({ success: true, message: 'Job removed successfully.' });
});

// ─────────────────────────────────────────
// @desc    Get jobs posted by the logged-in employer
// @route   GET /api/jobs/my-jobs
// @access  Private (employer only)
// ─────────────────────────────────────────
const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('company', 'name logo');

  // Attach application count to each job
  const Application = require('../models/Application');
  const jobsWithCounts = await Promise.all(
    jobs.map(async (job) => {
      const count = await Application.countDocuments({ job: job._id });
      return { ...job.toObject(), applicationCount: count };
    })
  );

  res.status(200).json({ success: true, count: jobs.length, jobs: jobsWithCounts });
});

// ─────────────────────────────────────────
// @desc    Save / unsave a job (toggle bookmark)
// @route   PUT /api/jobs/:id/save
// @access  Private (seeker only)
// ─────────────────────────────────────────
const toggleSaveJob = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user._id);
  const jobId = req.params.id;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  const isSaved = user.savedJobs.includes(jobId);

  if (isSaved) {
    user.savedJobs = user.savedJobs.filter((id) => id.toString() !== jobId);
  } else {
    user.savedJobs.push(jobId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    saved: !isSaved,
    message: isSaved ? 'Job removed from saved.' : 'Job saved successfully.',
  });
});

// ─────────────────────────────────────────
// @desc    Get seeker's saved jobs
// @route   GET /api/jobs/saved
// @access  Private (seeker only)
// ─────────────────────────────────────────
const getSavedJobs = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user._id).populate({
    path: 'savedJobs',
    populate: { path: 'company', select: 'name logo location' },
  });

  res.status(200).json({ success: true, jobs: user.savedJobs });
});

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  toggleSaveJob,
  getSavedJobs,
};
