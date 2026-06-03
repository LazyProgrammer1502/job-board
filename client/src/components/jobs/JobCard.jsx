import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobsService } from '../../api/services';
import { useState } from 'react';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  'full-time':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'part-time':  'bg-amber-50 text-amber-700 border-amber-200',
  'contract':   'bg-purple-50 text-purple-700 border-purple-200',
  'internship': 'bg-sky-50 text-sky-700 border-sky-200',
  'remote':     'bg-rose-50 text-rose-700 border-rose-200',
};

const EXP_LABELS = { entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead' };

const formatSalary = (salary) => {
  if (!salary?.min && !salary?.max) return null;
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;
  if (salary.min && salary.max) return `${salary.currency || 'PKR'} ${fmt(salary.min)}–${fmt(salary.max)}`;
  if (salary.min) return `${salary.currency || 'PKR'} ${fmt(salary.min)}+`;
  return null;
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const JobCard = ({ job, saved: initialSaved = false, onSaveToggle }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Login to save jobs');
    setSaving(true);
    try {
      const { data } = await jobsService.toggleSave(job._id);
      setSaved(data.saved);
      toast.success(data.message);
      onSaveToggle?.();
    } catch {
      toast.error('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const salary = formatSalary(job.salary);

  return (
    <Link
      to={`/jobs/${job._id}`}
      className="group block bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Company logo */}
        <div className="flex items-center gap-3 min-w-0">
          {job.company?.logo ? (
            <img src={job.company.logo} alt={job.company.name}
              className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(job.company?.name || job.title)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">{job.company?.name || 'Company'}</p>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug truncate">
              {job.title}
            </h3>
          </div>
        </div>

        {/* Save button (seeker only) */}
        {user?.role === 'seeker' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title={saved ? 'Unsave' : 'Save job'}
          >
            <svg className={`w-5 h-5 transition-colors ${saved ? 'text-blue-600 fill-blue-600' : 'text-gray-300 hover:text-gray-400'}`}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`badge border text-xs ${TYPE_STYLES[job.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {job.type}
        </span>
        {job.experience && (
          <span className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs">
            {EXP_LABELS[job.experience]}
          </span>
        )}
        {job.skills?.slice(0, 3).map((s) => (
          <span key={s} className="badge bg-blue-50 text-blue-700 border border-blue-100 text-xs">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {job.location}
          </span>
          {job.applicationCount > 0 && (
            <span>{job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {salary && <span className="text-xs font-medium text-emerald-600">{salary}</span>}
          <span className="text-xs text-gray-400">{timeAgo(job.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
