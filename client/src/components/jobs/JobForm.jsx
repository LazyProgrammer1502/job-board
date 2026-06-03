import { useState } from 'react';
import toast from 'react-hot-toast';
import { jobsService } from '../../api/services';

const TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXPERIENCE = ['entry', 'mid', 'senior', 'lead'];

const EMPTY_FORM = {
  title: '',
  description: '',
  requirements: '',
  location: '',
  type: 'full-time',
  experience: 'entry',
  skillInput: '',
  skills: [],
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'PKR',
  salaryPeriod: 'monthly',
  deadline: '',
};

const jobToForm = (job) => ({
  title: job.title || '',
  description: job.description || '',
  requirements: job.requirements || '',
  location: job.location || '',
  type: job.type || 'full-time',
  experience: job.experience || 'entry',
  skillInput: '',
  skills: job.skills || [],
  salaryMin: job.salary?.min || '',
  salaryMax: job.salary?.max || '',
  salaryCurrency: job.salary?.currency || 'PKR',
  salaryPeriod: job.salary?.period || 'monthly',
  deadline: job.deadline ? job.deadline.split('T')[0] : '',
});

const JobForm = ({ job = null, onSuccess, onCancel }) => {
  const [form, setForm] = useState(job ? jobToForm(job) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!job;

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const addSkill = () => {
    const skill = form.skillInput.trim();
    if (!skill) return;
    if (form.skills.includes(skill)) return toast.error('Skill already added');
    if (form.skills.length >= 10) return toast.error('Max 10 skills');
    set('skills', [...form.skills, skill]);
    set('skillInput', '');
  };

  const removeSkill = (s) => set('skills', form.skills.filter((x) => x !== s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Job title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.location.trim()) return toast.error('Location is required');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      location: form.location.trim(),
      type: form.type,
      experience: form.experience,
      skills: form.skills,
      deadline: form.deadline || null,
      salary: {
        min: form.salaryMin ? Number(form.salaryMin) : undefined,
        max: form.salaryMax ? Number(form.salaryMax) : undefined,
        currency: form.salaryCurrency,
        period: form.salaryPeriod,
      },
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await jobsService.update(job._id, payload);
        toast.success('Job updated successfully');
      } else {
        await jobsService.create(payload);
        toast.success('Job posted successfully 🎉');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Job title *</label>
        <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
          className="input" placeholder="e.g. Senior React Developer" maxLength={100} required />
      </div>

      {/* Location + Type row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
          <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
            className="input" placeholder="e.g. Lahore, Pakistan" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job type *</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
            {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
      </div>

      {/* Experience + Deadline row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience level</label>
          <select value={form.experience} onChange={(e) => set('experience', e.target.value)} className="input">
            {EXPERIENCE.map((l) => <option key={l} value={l} className="capitalize">{l}-level</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Application deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)}
            min={new Date().toISOString().split('T')[0]} className="input" />
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary (optional)</label>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)}
            className="input col-span-1" placeholder="Min" min={0} />
          <input type="number" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)}
            className="input col-span-1" placeholder="Max" min={0} />
          <select value={form.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value)} className="input">
            <option>PKR</option><option>USD</option><option>EUR</option>
          </select>
          <select value={form.salaryPeriod} onChange={(e) => set('salaryPeriod', e.target.value)} className="input">
            <option value="monthly">/ month</option>
            <option value="yearly">/ year</option>
          </select>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Required skills <span className="text-gray-400 font-normal">({form.skills.length}/10)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text" value={form.skillInput}
            onChange={(e) => set('skillInput', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
            className="input flex-1" placeholder="e.g. React, Node.js, MongoDB..."
          />
          <button type="button" onClick={addSkill} className="btn-secondary px-4 text-sm shrink-0">
            Add
          </button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1 text-xs font-medium">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="ml-0.5 hover:text-blue-900">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Job description *</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
          rows={6} maxLength={5000} className="input resize-none"
          placeholder="Describe the role, responsibilities, team culture..." required />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/5000</p>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Requirements <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)}
          rows={4} maxLength={3000} className="input resize-none"
          placeholder="Education, years of experience, specific tools..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-2.5">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5">
          {submitting ? (isEditing ? 'Saving...' : 'Posting...') : (isEditing ? 'Save changes' : 'Post job')}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
