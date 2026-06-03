import { useState, useEffect } from 'react';
import { applicationsService } from '../../api/services';
import StatusBadge from '../ui/StatusBadge';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'reviewed', 'accepted', 'rejected'];

const ApplicantsPanel = ({ job, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null); // id being updated
  const [expanded, setExpanded] = useState(null); // expanded applicant id

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await applicationsService.getJobApplicants(job._id, filter ? { status: filter } : {});
        setApplications(data.applications);
      } catch {
        toast.error('Failed to load applicants');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [job._id, filter]);

  const handleStatusChange = async (appId, status) => {
    setUpdating(appId);
    try {
      const { data } = await applicationsService.updateStatus(appId, { status });
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: data.application.status } : a))
      );
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Applicants</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Stats row */}
        {!loading && applications.length > 0 && (
          <div className="flex gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
            {['pending', 'reviewed', 'accepted', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? '' : s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`font-bold ${counts[s] ? 'text-gray-900' : 'text-gray-400'}`}>
                  {counts[s] || 0}
                </span>
                <span className="text-gray-500 capitalize">{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium text-gray-600">No applicants yet</p>
              <p className="text-sm mt-1">Applications will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applications.map((app) => (
                <ApplicantRow
                  key={app._id}
                  app={app}
                  isExpanded={expanded === app._id}
                  isUpdating={updating === app._id}
                  onToggle={() => setExpanded(expanded === app._id ? null : app._id)}
                  onStatusChange={(s) => handleStatusChange(app._id, s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ApplicantRow = ({ app, isExpanded, isUpdating, onToggle, onStatusChange }) => {
  const { applicant } = app;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {applicant?.avatar ? (
          <img src={applicant.avatar} alt={applicant.name}
            className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {applicant?.name?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{applicant?.name}</span>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{applicant?.email}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {app.resume?.url && (
            <a href={app.resume.url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
              title="View resume">
              CV
            </a>
          )}
          <button onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors">
            {isExpanded ? 'Less ▲' : 'More ▼'}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="mt-3 pl-13 ml-[52px] space-y-3">
          {/* Skills */}
          {applicant?.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {applicant.skills.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{s}</span>
              ))}
            </div>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Cover letter</p>
              <p className="text-sm text-gray-700 leading-relaxed">{app.coverLetter}</p>
            </div>
          )}

          {/* Bio */}
          {applicant?.bio && (
            <p className="text-xs text-gray-500 italic">{applicant.bio}</p>
          )}

          {/* Status change buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <p className="text-xs text-gray-400 self-center">Update status:</p>
            {['reviewed', 'accepted', 'rejected'].map((s) => (
              <button
                key={s}
                disabled={isUpdating || app.status === s}
                onClick={() => onStatusChange(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed capitalize ${
                  app.status === s
                    ? 'bg-gray-100 text-gray-400 border-gray-200'
                    : s === 'accepted'
                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    : s === 'rejected'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {isUpdating ? '...' : s}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Applied {new Date(app.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicantsPanel;
