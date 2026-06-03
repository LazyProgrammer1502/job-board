const JobCardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-4 bg-gray-100 rounded w-48" />
      </div>
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-5 bg-gray-100 rounded-full w-16" />
      <div className="h-5 bg-gray-100 rounded-full w-12" />
      <div className="h-5 bg-gray-100 rounded-full w-20" />
    </div>
    <div className="flex justify-between mt-4 pt-3 border-t border-gray-50">
      <div className="h-3 bg-gray-100 rounded w-24" />
      <div className="h-3 bg-gray-100 rounded w-16" />
    </div>
  </div>
);

const JobListSkeleton = ({ count = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => <JobCardSkeleton key={i} />)}
  </div>
);

export default JobListSkeleton;
