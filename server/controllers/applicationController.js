const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendApplicationEmail } = require('../utils/emailService');

// ─────────────────────────────────────────
// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (seeker only)
// ─────────────────────────────────────────
const applyForJob = asyncHandler(async (req, res) => {
  const { coverLetter } = req.body;
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate('employer', 'email name');
  if (!job || !job.isActive) {
    return res.status(404).json({ success: false, message: 'Job not found or no longer active.' });
  }

  // Check deadline
  if (job.deadline && new Date(job.deadline) < new Date()) {
    return res.status(400).json({ success: false, message: 'Application deadline has passed.' });
  }

  // Prevent duplicate applications
  const existing = await Application.findOne({ job: jobId, applicant: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already applied for this job.' });
  }

  // Resume — use uploaded file or fallback to profile resume
  const seeker = await User.findById(req.user._id);
  const resumeUrl = req.file?.path || seeker.resume?.url;
  const resumeName = req.file?.originalname || seeker.resume?.originalName;

  if (!resumeUrl) {
    return res.status(400).json({ success: false, message: 'Please upload a resume or add one to your profile first.' });
  }

  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    employer: job.employer._id,
    coverLetter,
    resume: { url: resumeUrl, originalName: resumeName },
  });

  // Increment job application count
  await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

  // Send confirmation email to seeker
  try {
    await sendApplicationEmail({
      to: seeker.email,
      seekerName: seeker.name,
      jobTitle: job.title,
      companyName: job.employer.name,
      type: 'confirmation',
    });
  } catch (e) {
    console.error('Email send failed (non-critical):', e.message);
  }

  await application.populate([
    { path: 'job', select: 'title location type' },
    { path: 'applicant', select: 'name email' },
  ]);

  res.status(201).json({ success: true, application });
});

// ─────────────────────────────────────────
// @desc    Get all applications for the logged-in seeker
// @route   GET /api/applications/my
// @access  Private (seeker only)
// ─────────────────────────────────────────
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'job',
      select: 'title location type salary isActive',
      populate: { path: 'company', select: 'name logo' },
    });

  res.status(200).json({ success: true, count: applications.length, applications });
});

// ─────────────────────────────────────────
// @desc    Withdraw an application
// @route   DELETE /api/applications/:id
// @access  Private (seeker — own applications only)
// ─────────────────────────────────────────
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  if (application.applicant.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Can only withdraw pending applications.' });
  }

  await application.deleteOne();
  await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });

  res.status(200).json({ success: true, message: 'Application withdrawn.' });
});

// ─────────────────────────────────────────
// @desc    Get all applicants for a specific job (employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (employer — own jobs only)
// ─────────────────────────────────────────
const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  if (job.employer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const { status } = req.query;
  const filter = { job: req.params.jobId };
  if (status) filter.status = status;

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .populate('applicant', 'name email avatar skills bio resume');

  res.status(200).json({ success: true, count: applications.length, applications });
});

// ─────────────────────────────────────────
// @desc    Update application status (employer)
// @route   PUT /api/applications/:id/status
// @access  Private (employer — own job applications only)
// ─────────────────────────────────────────
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, employerNote } = req.body;

  const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email')
    .populate('job', 'title');

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  if (application.employer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  application.status = status;
  if (employerNote) application.employerNote = employerNote;
  await application.save();

  // Email the seeker when status changes to accepted or rejected
  if (status === 'accepted' || status === 'rejected') {
    try {
      await sendApplicationEmail({
        to: application.applicant.email,
        seekerName: application.applicant.name,
        jobTitle: application.job.title,
        companyName: req.user.name,
        type: status,
        note: employerNote,
      });
    } catch (e) {
      console.error('Status email failed (non-critical):', e.message);
    }
  }

  res.status(200).json({ success: true, application });
});

// ─────────────────────────────────────────
// @desc    Get single application detail
// @route   GET /api/applications/:id
// @access  Private (applicant or employer)
// ─────────────────────────────────────────
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email avatar skills bio resume')
    .populate('job', 'title location type salary')
    .populate('employer', 'name email');

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  const isApplicant = application.applicant._id.toString() === req.user._id.toString();
  const isEmployer = application.employer._id.toString() === req.user._id.toString();

  if (!isApplicant && !isEmployer) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  res.status(200).json({ success: true, application });
});

module.exports = {
  applyForJob,
  getMyApplications,
  withdrawApplication,
  getJobApplicants,
  updateApplicationStatus,
  getApplication,
};
