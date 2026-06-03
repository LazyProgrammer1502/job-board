import { useState, useEffect, useCallback } from 'react';
import { jobsService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import JobForm from '../../components/jobs/JobForm';
import ApplicantsPanel from '../../components/jobs/ApplicantsPanel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [postOpen, setPostOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [applicantsJob, setApplicantsJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await jobsService.getMyJobs();
      setJobs(data.jobs);
    } catch {
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = async () => {
    try {
      await jobsService.remove(deleteJob._id);
      toast.success('Job removed');
      setDeleteJob(null);
      fetchJobs();
    } catch {
      toast.error('Failed to remove job');
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await jobsService.update(job._id, { isActive: !job.isActive });
      toast.success(job.isActive ? 'Job closed' : 'Job reopened');
      fetchJobs();
    } catch {
      toast.error('Failed to update job');
    }
  };

  // Summary stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.isActive).length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>
            </p>
          </div>
          <button onClick={() => setPostOpen(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Post a job
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total jobs posted" value={totalJobs} icon="📋" />
          <StatCard label="Active listings" value={activeJobs} icon="✅" color="emerald" />
          <StatCard label="Total applicants" value={totalApplicants} icon="👥" color="blue" />
        </div>

        {/* Jobs table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your job listings</h2>
            <span className="text-xs text-gray-400">{totalJobs} total</span>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-gray-700 mb-1">No jobs posted yet</p>
              <p className="text-sm text-gray-400 mb-5">Post your first job to start receiving applicants</p>
              <button onClick={() => setPostOpen(true)} className="btn-primary text-sm">
                Post your first job
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicants</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Posted</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <JobRow
                      key={job._id}
                      job={job}
                      onEdit={() => setEditJob(job)}
                      onDelete={() => setDeleteJob(job)}
                      onViewApplicants={() => setApplicantsJob(job)}
                      onToggleActive={() => handleToggleActive(job)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Post Job modal */}
      <Modal
        isOpen={postOpen}
        onClose={() => setPostOpen(false)}
        title="Post a new job"
        subtitle="Fill in the details below to publish your listing"
        size="lg"
      >
        <JobForm
          onSuccess={() => { setPostOpen(false); fetchJobs(); }}
          onCancel={() => setPostOpen(false)}
        />
      </Modal>

      {/* Edit Job modal */}
      <Modal
        isOpen={!!editJob}
        onClose={() => setEditJob(null)}
        title="Edit job listing"
        subtitle={editJob?.title}
        size="lg"
      >
        {editJob && (
          <JobForm
            job={editJob}
            onSuccess={() => { setEditJob(null); fetchJobs(); }}
            onCancel={() => setEditJob(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteJob}
        onCancel={() => setDeleteJob(null)}
        onConfirm={handleDelete}
        title="Remove job listing"
        message={`Are you sure you want to remove "${deleteJob?.title}"? This will hide it from all listings.`}
        confirmLabel="Remove"
        danger
      />

      {/* Applicants slide panel */}
      {applicantsJob && (
        <ApplicantsPanel
          job={applicantsJob}
          onClose={() => setApplicantsJob(null)}
        />
      )}
    </div>
  );
};

// ── Sub-components ───────────────────────────────────────

const JobRow = ({ job, onEdit, onDelete, onViewApplicants, onToggleActive }) => (
  <tr className="hover:bg-gray-50/50 transition-colors">
    <td className="px-6 py-4">
      <div>
        <p className="font-medium text-gray-900">{job.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">📍 {job.location}</p>
      </div>
    </td>
    <td className="px-4 py-4">
      <span className="text-xs text-gray-600 capitalize">{job.type}</span>
    </td>
    <td className="px-4 py-4">
      <StatusBadge status={job.isActive ? 'active' : 'closed'} />
    </td>
    <td className="px-4 py-4">
      <button
        onClick={onViewApplicants}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <span className="font-bold">{job.applicationCount || 0}</span>
        <span className="text-xs text-gray-400 hover:text-blue-600">view →</span>
      </button>
    </td>
    <td className="px-4 py-4 text-xs text-gray-400">
      {new Date(job.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
    </td>
    <td className="px-4 py-4">
      <div className="flex items-center gap-1">
        <ActionBtn onClick={onEdit} title="Edit" color="blue">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </ActionBtn>
        <ActionBtn onClick={onToggleActive} title={job.isActive ? 'Close listing' : 'Reopen listing'} color="amber">
          {job.isActive ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          )}
        </ActionBtn>
        <ActionBtn onClick={onDelete} title="Remove" color="red">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </ActionBtn>
      </div>
    </td>
  </tr>
);

const ActionBtn = ({ onClick, title, color, children }) => {
  const colors = {
    blue: 'hover:bg-blue-50 hover:text-blue-600 text-gray-400',
    amber: 'hover:bg-amber-50 hover:text-amber-600 text-gray-400',
    red: 'hover:bg-red-50 hover:text-red-500 text-gray-400',
  };
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}>
      {children}
    </button>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold mb-1 ${color ? colors[color]?.split(' ')[1] : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-4">
        <div className="h-4 bg-gray-100 rounded flex-1" />
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-12" />
      </div>
    ))}
  </div>
);

export default EmployerDashboard;
