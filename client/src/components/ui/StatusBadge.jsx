const STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:   'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_DOTS = {
  pending:  'bg-amber-400',
  reviewed: 'bg-blue-400',
  accepted: 'bg-emerald-500',
  rejected: 'bg-red-400',
  active:   'bg-emerald-500',
  closed:   'bg-gray-400',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-gray-400'}`} />
    {status}
  </span>
);

export default StatusBadge;
