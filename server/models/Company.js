const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 100,
    },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    bio: { type: String, maxlength: 1000, default: '' },
    location: { type: String, trim: true },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    },
    industry: { type: String, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one company per employer
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
