import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobsService, applicationsService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  'full-time':  'bg-emerald-50 text-emerald-700',
  'part-time':  'bg-amber-50 text-amber-700',
  'contract':   'bg-purple-50 text-purple-700',
  'internship': 'bg-sky-50 text-sky-700',
  'remote':     'bg-rose-50 text-rose-700',
};

const formatSalary = (salary) => {
  if (!salary?.min && !salary?.max) return null;
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;
  const cur = salary.currency || 'PKR';
  const per = salary.period === 'yearly' ? '/yr' : '/mo';
  if (salary.min && salary.max) return `${cur} ${fmt(salary.min)} – ${fmt(salary.max)}${per}`;
  if (salary.min) return `${cur} ${fmt(salary.min)}+${per}`;
  return null;
};

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await jobsService.getOne(id);
        setJob(data.job);

        // Check if already applied
        if (user?.role === 'seeker') {
          try {
            const { data: myApps } = await applicationsService.getMy();
            setHasApplied(myApps.applications.some((a) => a.job?._id === id));
          } catch { /* ignore */ }
        }
      } catch {
        toast.error('Job not found');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!user) return toast.error('Login to save jobs');
    try {
      const { data } = await jobsService.toggleSave(id);
      setSaved(data.saved);
      toast.success(data.message);
    } catch {
      toast.error('Failed to save job');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!job) return null;

  const salary = formatSalary(job.salary);
  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                {job.company?.logo ? (
                  <img src={job.company.logo} alt={job.company.name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {job.title[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 leading-snug">{job.title}</h1>
                  <p className="text-gray-500 mt-0.5">
                    {job.company?.name || 'Company'} · {job.location}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`badge text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_STYLES[job.type] || 'bg-gray-100 text-gray-600'}`}>
                      {job.type}
                    </span>
                    {job.experience && (
                      <span className="badge bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                        {job.experience}-level
                      </span>
                    )}
                    {salary && (
                      <span className="badge bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-50 text-sm">
                <MetaItem label="Posted" value={new Date(job.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })} />
                <MetaItem label="Applicants" value={`${job.applicationCount || 0} applied`} />
                {job.deadline && (
                  <MetaItem
                    label="Deadline"
                    value={new Date(job.deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    danger={isExpired}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <Section title="Job description">
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </Section>

            {/* Requirements */}
            {job.requirements && (
              <Section title="Requirements">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </Section>
            )}

            {/* Skills */}
            {job.skills?.length > 0 && (
              <Section title="Skills required">
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              {user?.role === 'employer' ? (
                <p className="text-sm text-gray-500 text-center">
                  Switch to a seeker account to apply.
                </p>
              ) : isExpired ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-red-600 mb-1">Applications closed</p>
                  <p className="text-xs text-gray-400">Deadline has passed</p>
                </div>
              ) : hasApplied ? (
                <div className="text-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Applied!</p>
                  <p className="text-xs text-gray-400 mt-0.5">Track it in your dashboard</p>
                  <Link to="/seeker/applications" className="btn-secondary text-sm w-full mt-3 block text-center">
                    View applications
                  </Link>
                </div>
              ) : (
                <>
                  {user ? (
                    <button onClick={() => setApplyOpen(true)} className="btn-primary w-full py-2.5">
                      Apply now
                    </button>
                  ) : (
                    <Link to="/login" state={{ from: `/jobs/${id}` }} className="btn-primary w-full py-2.5 block text-center">
                      Login to apply
                    </Link>
                  )}
                  {user?.role === 'seeker' && (
                    <button onClick={handleSave}
                      className="btn-secondary w-full py-2.5 mt-2 text-sm">
                      {saved ? '★ Saved' : '☆ Save job'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Company card */}
            {job.company && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">About the company</h3>
                <div className="flex items-center gap-3 mb-3">
                  {job.company.logo && (
                    <img src={job.company.logo} alt={job.company.name}
                      className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{job.company.name}</p>
                    {job.company.location && <p className="text-xs text-gray-400">{job.company.location}</p>}
                  </div>
                </div>
                {job.company.bio && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{job.company.bio}</p>
                )}
                {job.company.size && (
                  <p className="text-xs text-gray-400 mt-2">{job.company.size} employees</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {applyOpen && (
        <ApplyModal
          job={job}
          onClose={() => setApplyOpen(false)}
          onSuccess={() => { setApplyOpen(false); setHasApplied(true); }}
        />
      )}
    </div>
  );
};

// ── Sub-components ───────────────────────────────────────

const MetaItem = ({ label, value, danger }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className={`font-medium text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
    {children}
  </div>
);

const ApplyModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('coverLetter', coverLetter);
      if (resumeFile) formData.append('resume', resumeFile);

      await applicationsService.apply(job._id, formData);
      toast.success('Application submitted! 🎉');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Apply for this role</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.title} · {job.company?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Resume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Resume (PDF)
              {user?.resume?.url && <span className="text-gray-400 font-normal ml-1">— or use profile resume</span>}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
            {!user?.resume?.url && !resumeFile && (
              <p className="text-xs text-amber-600 mt-1.5">
                You have no resume saved. Upload one above or add it to your profile.
              </p>
            )}
          </div>

          {/* Cover letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Why are you a good fit for this role?"
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{coverLetter.length}/2000</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!user?.resume?.url && !resumeFile)}
              className="btn-primary flex-1 py-2.5"
            >
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
    <div className="h-4 bg-gray-100 rounded w-24 mb-6" />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-48" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 h-32" />
    </div>
  </div>
);

export default JobDetail;
