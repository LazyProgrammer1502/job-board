const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXPERIENCE = ['entry', 'mid', 'senior', 'lead'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'salary_high', label: 'Highest salary' },
  { value: 'salary_low', label: 'Lowest salary' },
];

const FilterSidebar = ({ filters, onFilterChange, onReset, totalResults }) => {
  return (
    <aside className="w-full">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onReset}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset all
          </button>
        </div>

        {/* Sort */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Sort by
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="input text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Location
          </label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            placeholder="e.g. Karachi, Lahore..."
            className="input text-sm"
          />
        </div>

        {/* Job type */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Job type
          </label>
          <div className="space-y-2">
            {JOB_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={filters.type === type}
                  onChange={() => onFilterChange('type', filters.type === type ? '' : type)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                  {type}
                </span>
              </label>
            ))}
            {filters.type && (
              <button onClick={() => onFilterChange('type', '')}
                className="text-xs text-gray-400 hover:text-gray-600 mt-1">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Experience level
          </label>
          <div className="space-y-2">
            {EXPERIENCE.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="experience"
                  value={level}
                  checked={filters.experience === level}
                  onChange={() => onFilterChange('experience', filters.experience === level ? '' : level)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                  {level}-level
                </span>
              </label>
            ))}
            {filters.experience && (
              <button onClick={() => onFilterChange('experience', '')}
                className="text-xs text-gray-400 hover:text-gray-600 mt-1">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        {totalResults > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {totalResults} job{totalResults !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default FilterSidebar;
