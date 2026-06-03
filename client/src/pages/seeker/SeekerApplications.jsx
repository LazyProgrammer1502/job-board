import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { applicationsService, jobsService } from '../../api/services';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const TABS = ['applications', 'saved'];

const STATUS_STEPS = ['pending', 'reviewed', 'accepted'];

const SeekerApplications = () => {
  const [tab, setTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await applicationsService.getMy();
      setApplications(data.applications);
    } catch {
      toast.error('Failed to load applications');
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    try {
      const { data } = await jobsService.getSaved();
      setSavedJobs(data.jobs);
    } catch {
      toast.error('Failed to load saved jobs');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchApplications(), fetchSaved()]);
      setLoading(false);
    };
    load();
  }, [fetchApplications, fetchSaved]);

  const handleWithdraw = async () => {
    try {
      await applicationsService.withdraw(withdrawTarget._id);
      toast.success('Application withdrawn');
      setWithdrawTarget(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await jobsService.toggleSave(jobId);
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Removed from saved');
    } catch {
      toast.error('Failed to unsave');
    }
  };

  // Stats
  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Job Search</h1>
          <p className="text-gray-500 text-sm mt-1">Track your applications and saved jobs</p>
        </div>

        {/* Stats */}
        {!loading && applications.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Applied', value: applications.length, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Pending', value: counts.pending || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Accepted', value: counts.accepted || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Rejected', value: counts.rejected || 0, color: 'text-red-500', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'applications'
                ? `Applications ${applications.length > 0 ? `(${applications.length})` : ''}`
                : `Saved ${savedJobs.length > 0 ? `(${savedJobs.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <ListSkeleton />
        ) : tab === 'applications' ? (
          applications.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No applications yet"
              desc="Start applying for jobs to track them here"
              action={<Link to="/jobs" className="btn-primary text-sm mt-3 inline-block">Browse jobs</Link>}
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard
                  key={app._id}
                  app={app}
                  isExpanded={expanded === app._id}
                  onToggle={() => setExpanded(expanded === app._id ? null : app._id)}
                  onWithdraw={() => setWithdrawTarget(app)}
                />
              ))}
            </div>
          )
        ) : (
          savedJobs.length === 0 ? (
            <EmptyState
              icon="🔖"
              title="No saved jobs"
              desc="Bookmark jobs while browsing to find them here"
              action={<Link to="/jobs" className="btn-primary text-sm mt-3 inline-block">Browse jobs</Link>}
            />
          ) : (
            <div className="space-y-3">
              {savedJobs.map((job) => (
                <SavedJobCard key={job._id} job={job} onUnsave={() => handleUnsave(job._id)} />
              ))}
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        isOpen={!!withdrawTarget}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        title="Withdraw application"
        message={`Withdraw your application for "${withdrawTarget?.job?.title}"? This cannot be undone.`}
        confirmLabel="Withdraw"
        danger
      />
    </div>
  );
};

// ── Application Card ─────────────────────────────────────

const ApplicationCard = ({ app, isExpanded, onToggle, onWithdraw }) => {
  const job = app.job;
  const company = job?.company;
  const isRejected = app.status === 'rejected';
  const isAccepted = app.status === 'accepted';

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isAccepted ? 'border-emerald-200' : isRejected ? 'border-red-100' : 'border-gray-100'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-5">
        {/* Company logo */}
        {company?.logo ? (
          <img src={company.logo} alt={company.name}
            className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
            {(job?.title || 'J')[0]}
          </div>
        )}

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/jobs/${job?._id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
              {job?.title}
            </Link>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {company?.name || 'Company'} · {job?.location}
          </p>
        </div>

        {/* Date + expand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date(app.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">

          {/* Status timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Application progress
            </p>
            <StatusTimeline status={app.status} />
          </div>

          {/* Employer note */}
          {app.employerNote && (
            <div className={`rounded-xl p-3 text-sm ${
              isAccepted ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-700'
            }`}>
              <p className="text-xs font-medium text-gray-500 mb-1">Note from employer</p>
              <p className="leading-relaxed">{app.employerNote}</p>
            </div>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Your cover letter</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                {app.coverLetter}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            {app.resume?.url && (
              <a href={app.resume.url} target="_blank" rel="noreferrer"
                className="btn-secondary text-xs py-1.5 px-3">
                View resume
              </a>
            )}
            <Link to={`/jobs/${job?._id}`} className="btn-secondary text-xs py-1.5 px-3">
              View job
            </Link>
            {app.status === 'pending' && (
              <button onClick={onWithdraw}
                className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                Withdraw
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Status Timeline ──────────────────────────────────────

const StatusTimeline = ({ status }) => {
  const isRejected = status === 'rejected';

  const steps = isRejected
    ? ['pending', 'reviewed', 'rejected']
    : STATUS_STEPS;

  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = i <= currentIdx;
        const isLast = i === steps.length - 1;
        const isCurrentStep = i === currentIdx;
        const isCurrent = isCurrentStep && status !== 'accepted';

        const dotColor = isDone
          ? step === 'accepted'
            ? 'bg-emerald-500 ring-4 ring-emerald-100'
            : step === 'rejected'
            ? 'bg-red-400 ring-4 ring-red-100'
            : 'bg-blue-500 ring-4 ring-blue-100'
          : 'bg-gray-200';

        const lineColor = i < currentIdx ? 'bg-blue-400' : 'bg-gray-100';
        const labelColor = isDone ? (step === 'rejected' ? 'text-red-500' : step === 'accepted' ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400';

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full transition-all ${dotColor} ${isCurrent ? 'animate-pulse' : ''}`} />
              <span className={`text-xs mt-1.5 font-medium capitalize ${labelColor}`}>{step}</span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 ${lineColor} transition-all`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Saved Job Card ───────────────────────────────────────

const SavedJobCard = ({ job, onUnsave }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-200 transition-all">
    {job.company?.logo ? (
      <img src={job.company.logo} alt={job.company.name}
        className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" />
    ) : (
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
        {job.title[0]}
      </div>
    )}

    <div className="flex-1 min-w-0">
      <Link to={`/jobs/${job._id}`}
        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block truncate">
        {job.title}
      </Link>
      <p className="text-sm text-gray-500 mt-0.5 truncate">
        {job.company?.name || 'Company'} · {job.location}
        {job.type && <span className="ml-2 capitalize text-xs text-gray-400">· {job.type}</span>}
      </p>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <Link to={`/jobs/${job._id}`} className="btn-primary text-xs py-1.5 px-4">
        Apply
      </Link>
      <button onClick={onUnsave}
        className="p-2 hover:bg-red-50 hover:text-red-500 text-gray-300 rounded-lg transition-colors"
        title="Remove from saved">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
      </button>
    </div>
  </div>
);

// ── Shared helpers ───────────────────────────────────────

const EmptyState = ({ icon, title, desc, action }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
    {action}
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default SeekerApplications;
