import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import JobCard from '../../components/jobs/JobCard';
import FilterSidebar from '../../components/jobs/FilterSidebar';
import Pagination from '../../components/jobs/Pagination';
import JobListSkeleton from '../../components/jobs/JobListSkeleton';

const Jobs = () => {
  const { jobs, loading, error, filters, pagination, updateFilter, resetFilters } = useJobs();
  const [searchInput, setSearchInput] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero search bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Find your next role</h1>
          <p className="text-gray-500 text-sm mb-5">
            {pagination.total > 0
              ? `${pagination.total} open position${pagination.total !== 1 ? 's' : ''}`
              : 'Browse open positions'}
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Job title, skill, or keyword..."
                className="input pl-9 py-2.5"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5 whitespace-nowrap">
              Search
            </button>
            {filters.search && (
              <button type="button"
                onClick={() => { setSearchInput(''); updateFilter('search', ''); }}
                className="btn-secondary px-4 py-2.5 text-sm">
                Clear
              </button>
            )}
          </form>

          {/* Active filter pills */}
          {(filters.type || filters.experience || filters.location || filters.search) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.search && (
                <ActivePill label={`"${filters.search}"`} onRemove={() => { setSearchInput(''); updateFilter('search', ''); }} />
              )}
              {filters.type && <ActivePill label={filters.type} onRemove={() => updateFilter('type', '')} />}
              {filters.experience && <ActivePill label={`${filters.experience}-level`} onRemove={() => updateFilter('experience', '')} />}
              {filters.location && <ActivePill label={filters.location} onRemove={() => updateFilter('location', '')} />}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block w-60 shrink-0">
            <FilterSidebar
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              totalResults={pagination.total}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="btn-secondary text-sm w-full"
              >
                {mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
              </button>
              {mobileFiltersOpen && (
                <div className="mt-3">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={updateFilter}
                    onReset={resetFilters}
                    totalResults={pagination.total}
                  />
                </div>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <JobListSkeleton count={6} />
            ) : error ? (
              <EmptyState icon="⚠️" title="Something went wrong" desc={error} />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No jobs found"
                desc="Try adjusting your search or filters."
                action={<button onClick={resetFilters} className="btn-primary text-sm mt-3">Clear all filters</button>}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{jobs.length}</span> of{' '}
                    <span className="font-medium text-gray-700">{pagination.total}</span> jobs
                  </p>
                </div>

                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>

                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => updateFilter('page', p)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivePill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
    {label}
    <button onClick={onRemove} className="ml-1 hover:text-blue-900">✕</button>
  </span>
);

const EmptyState = ({ icon, title, desc, action }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
    {action}
  </div>
);

export default Jobs;
