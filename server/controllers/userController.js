const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────
// @desc    Get public profile of a user
// @route   GET /api/users/:id
// @access  Public
// ─────────────────────────────────────────
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name avatar bio skills role company createdAt')
    .populate('company', 'name logo location');

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.status(200).json({ success: true, user });
});

// ─────────────────────────────────────────
// @desc    Upload / update resume
// @route   PUT /api/users/resume
// @access  Private (seeker only)
// ─────────────────────────────────────────
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { resume: { url: req.file.path, originalName: req.file.originalname } },
    { new: true }
  );

  res.status(200).json({ success: true, resume: user.resume });
});

// ─────────────────────────────────────────
// @desc    Upload / update avatar
// @route   PUT /api/users/avatar
// @access  Private
// ─────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path },
    { new: true }
  );

  res.status(200).json({ success: true, avatar: user.avatar });
});

module.exports = { getUser, uploadResume, uploadAvatar };
