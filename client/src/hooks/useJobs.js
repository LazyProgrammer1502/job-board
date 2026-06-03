import { useState, useEffect, useCallback } from 'react';
import { jobsService } from '../api/services';

const DEFAULT_FILTERS = {
  search: '',
  location: '',
  type: '',
  experience: '',
  sort: 'newest',
  page: 1,
};

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });

  const fetchJobs = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await jobsService.getAll(params);
      setJobs(data.jobs);
      setPagination({
        total: data.total,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Strip empty values before sending
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
    );
    fetchJobs(clean);
  }, [filters, fetchJobs]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return { jobs, loading, error, filters, pagination, updateFilter, resetFilters };
};
